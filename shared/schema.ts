import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bridges = pgTable("bridges", {
  id: serial("id").primaryKey(),
  discordChannelId: text("discord_channel_id").notNull(),
  revoltChannelId: text("revolt_channel_id").notNull(),
  enabled: boolean("enabled").notNull().default(true),
});

export const masquerades = pgTable("masquerades", {
  id: serial("id").primaryKey(),
  bridgeId: integer("bridge_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  avatar: text("avatar_url"),
  enabled: boolean("enabled").notNull().default(true),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  discordToken: text("discord_token").notNull(),
  revoltToken: text("revolt_token").notNull(),
  webhookUrl: text("webhook_url"),
  logLevel: text("log_level").notNull().default("info"),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
});

export const insertBridgeSchema = createInsertSchema(bridges).omit({ id: true });
export const insertMasqueradeSchema = createInsertSchema(masquerades).omit({ id: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true });

export type Bridge = typeof bridges.$inferSelect;
export type Masquerade = typeof masquerades.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Log = typeof logs.$inferSelect;

export type InsertBridge = z.infer<typeof insertBridgeSchema>;
export type InsertMasquerade = z.infer<typeof insertMasqueradeSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertLog = z.infer<typeof insertLogSchema>;
