import { 
  type Bridge, type InsertBridge,
  type Masquerade, type InsertMasquerade,
  type Settings, type InsertSettings,
  type Log, type InsertLog
} from "@shared/schema";

export interface IStorage {
  // Bridge operations
  getBridges(): Promise<Bridge[]>;
  getBridge(id: number): Promise<Bridge | undefined>;
  createBridge(bridge: InsertBridge): Promise<Bridge>;
  updateBridge(id: number, bridge: Partial<InsertBridge>): Promise<Bridge>;
  deleteBridge(id: number): Promise<void>;

  // Masquerade operations  
  getMasquerades(bridgeId: number): Promise<Masquerade[]>;
  getMasquerade(id: number): Promise<Masquerade | undefined>;
  createMasquerade(masquerade: InsertMasquerade): Promise<Masquerade>;
  updateMasquerade(id: number, masquerade: Partial<InsertMasquerade>): Promise<Masquerade>;
  deleteMasquerade(id: number): Promise<void>;

  // Settings operations
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  // Logs operations
  getLogs(limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  clearErrorLogs(): Promise<void>;
}

export class MemStorage implements IStorage {
  private bridges: Map<number, Bridge>;
  private masquerades: Map<number, Masquerade>;
  private settings: Settings | null;
  private logs: Log[];
  private currentId: { [key: string]: number };

  constructor() {
    this.bridges = new Map();
    this.masquerades = new Map();
    this.settings = null;
    this.logs = [];
    this.currentId = {
      bridges: 1,
      masquerades: 1,
      settings: 1,
      logs: 1
    };
  }

  // Bridge implementations
  async getBridges(): Promise<Bridge[]> {
    return Array.from(this.bridges.values());
  }

  async getBridge(id: number): Promise<Bridge | undefined> {
    return this.bridges.get(id);
  }

  async createBridge(bridge: InsertBridge): Promise<Bridge> {
    const id = this.currentId.bridges++;
    const newBridge: Bridge = { 
      ...bridge, 
      id, 
      enabled: bridge.enabled ?? true 
    };
    this.bridges.set(id, newBridge);
    return newBridge;
  }

  async updateBridge(id: number, bridge: Partial<InsertBridge>): Promise<Bridge> {
    const existing = await this.getBridge(id);
    if (!existing) throw new Error("Bridge not found");
    const updated = { ...existing, ...bridge };
    this.bridges.set(id, updated);
    return updated;
  }

  async deleteBridge(id: number): Promise<void> {
    this.bridges.delete(id);
  }

  // Masquerade implementations
  async getMasquerades(bridgeId: number): Promise<Masquerade[]> {
    return Array.from(this.masquerades.values()).filter(m => m.bridgeId === bridgeId);
  }

  async getMasquerade(id: number): Promise<Masquerade | undefined> {
    return this.masquerades.get(id);
  }

  async createMasquerade(masquerade: InsertMasquerade): Promise<Masquerade> {
    const id = this.currentId.masquerades++;
    const newMasquerade: Masquerade = { 
      ...masquerade, 
      id,
      enabled: masquerade.enabled ?? true,
      avatar: masquerade.avatar ?? null
    };
    this.masquerades.set(id, newMasquerade);
    return newMasquerade;
  }

  async updateMasquerade(id: number, masquerade: Partial<InsertMasquerade>): Promise<Masquerade> {
    const existing = await this.getMasquerade(id);
    if (!existing) throw new Error("Masquerade not found");
    const updated = { ...existing, ...masquerade };
    this.masquerades.set(id, updated);
    return updated;
  }

  async deleteMasquerade(id: number): Promise<void> {
    this.masquerades.delete(id);
  }

  // Settings implementations
  async getSettings(): Promise<Settings> {
    if (!this.settings) {
      // Return default settings if not initialized
      const id = this.currentId.settings++;
      this.settings = {
        id,
        discordToken: "",
        revoltToken: "",
        webhookUrl: null,
        logLevel: "info"
      };
    }
    return this.settings;
  }

  async updateSettings(settings: Partial<InsertSettings>): Promise<Settings> {
    if (!this.settings) {
      const id = this.currentId.settings++;
      this.settings = { 
        id, 
        discordToken: settings.discordToken ?? "",
        revoltToken: settings.revoltToken ?? "",
        webhookUrl: settings.webhookUrl ?? null,
        logLevel: settings.logLevel ?? "info"
      };
    } else {
      this.settings = { 
        ...this.settings, 
        ...settings,
        webhookUrl: settings.webhookUrl ?? this.settings.webhookUrl,
        logLevel: settings.logLevel ?? this.settings.logLevel,
        discordToken: settings.discordToken ?? this.settings.discordToken,
        revoltToken: settings.revoltToken ?? this.settings.revoltToken
      };
    }
    return this.settings;
  }

  // Logs implementations
  async getLogs(limit: number = 100): Promise<Log[]> {
    // 24時間以内のログのみを返す
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentLogs = this.logs.filter(log => log.timestamp >= twentyFourHoursAgo);
    return recentLogs.slice(-limit);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const id = this.currentId.logs++;
    const newLog: Log = { 
      ...log, 
      id,
      metadata: log.metadata ?? null 
    };
    this.logs.push(newLog);

    // 古いログを削除（1000件以上は保持しない）
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    return newLog;
  }

  // 新しいメソッド: エラーログをクリア
  async clearErrorLogs(): Promise<void> {
    const nonErrorLogs = this.logs.filter(log => log.level !== "error");
    this.logs = nonErrorLogs;
  }
}

export const storage = new MemStorage();