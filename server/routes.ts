import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBridgeSchema, insertMasqueradeSchema, insertSettingsSchema } from "@shared/schema";
import { initializeBridge } from "./bot/bridge";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Bridge routes
  app.get("/api/bridges", async (req, res) => {
    const bridges = await storage.getBridges();
    res.json(bridges);
  });

  app.post("/api/bridges", async (req, res) => {
    const result = insertBridgeSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    const bridge = await storage.createBridge(result.data);
    res.json(bridge);
  });

  app.patch("/api/bridges/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const result = insertBridgeSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    const bridge = await storage.updateBridge(id, result.data);
    res.json(bridge);
  });

  app.delete("/api/bridges/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteBridge(id);
    res.status(204).end();
  });

  // Masquerade routes
  app.get("/api/bridges/:bridgeId/masquerades", async (req, res) => {
    const bridgeId = parseInt(req.params.bridgeId);
    const masquerades = await storage.getMasquerades(bridgeId);
    res.json(masquerades);
  });

  app.post("/api/masquerades", async (req, res) => {
    const result = insertMasqueradeSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    const masquerade = await storage.createMasquerade(result.data);
    res.json(masquerade);
  });

  app.patch("/api/masquerades/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const result = insertMasqueradeSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    const masquerade = await storage.updateMasquerade(id, result.data);
    res.json(masquerade);
  });

  app.delete("/api/masquerades/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMasquerade(id);
    res.status(204).end();
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const result = insertSettingsSchema.partial().safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Updating settings and reinitializing bridge",
        metadata: {
          discordTokenPresent: !!result.data.discordToken,
          revoltTokenPresent: !!result.data.revoltToken,
        }
      });

      const settings = await storage.updateSettings(result.data);

      // Re-initialize bridge with new settings
      await initializeBridge(storage);

      res.json(settings);
    } catch (error) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Failed to update settings",
        metadata: { error: (error as Error).message }
      });
      throw error;
    }
  });

  // Logs routes
  app.get("/api/logs", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const logs = await storage.getLogs(limit);
    res.json(logs);
  });

  const httpServer = createServer(app);

  // Initial bridge setup
  storage.createLog({
    timestamp: new Date().toISOString(),
    level: "info",
    message: "Starting initial bridge setup"
  });

  initializeBridge(storage);

  return httpServer;
}