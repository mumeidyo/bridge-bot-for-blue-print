import { apiRequest } from "./queryClient";
import type { Bridge, InsertBridge, Masquerade, InsertMasquerade, Settings, Log } from "@shared/schema";

export const api = {
  // Bridge endpoints
  getBridges: async () => {
    const res = await fetch("/api/bridges");
    return res.json() as Promise<Bridge[]>;
  },

  createBridge: async (bridge: InsertBridge) => {
    const res = await apiRequest("POST", "/api/bridges", bridge);
    return res.json() as Promise<Bridge>;
  },

  updateBridge: async (id: number, bridge: Partial<InsertBridge>) => {
    const res = await apiRequest("PATCH", `/api/bridges/${id}`, bridge);
    return res.json() as Promise<Bridge>;
  },

  deleteBridge: async (id: number) => {
    await apiRequest("DELETE", `/api/bridges/${id}`);
  },

  // Masquerade endpoints
  getMasquerades: async (bridgeId: number) => {
    const res = await fetch(`/api/bridges/${bridgeId}/masquerades`);
    return res.json() as Promise<Masquerade[]>;
  },

  createMasquerade: async (masquerade: InsertMasquerade) => {
    const res = await apiRequest("POST", "/api/masquerades", masquerade);
    return res.json() as Promise<Masquerade>;
  },

  updateMasquerade: async (id: number, masquerade: Partial<InsertMasquerade>) => {
    const res = await apiRequest("PATCH", `/api/masquerades/${id}`, masquerade);
    return res.json() as Promise<Masquerade>;
  },

  deleteMasquerade: async (id: number) => {
    await apiRequest("DELETE", `/api/masquerades/${id}`);
  },

  // Settings endpoints
  getSettings: async () => {
    const res = await fetch("/api/settings");
    return res.json() as Promise<Settings>;
  },

  updateSettings: async (settings: Partial<Settings>) => {
    const res = await apiRequest("PATCH", "/api/settings", settings);
    return res.json() as Promise<Settings>;
  },

  // Logs endpoints
  getLogs: async (limit?: number) => {
    const url = limit ? `/api/logs?limit=${limit}` : "/api/logs";
    const res = await fetch(url);
    return res.json() as Promise<Log[]>;
  }
};
