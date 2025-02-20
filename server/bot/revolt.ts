import { Client } from "revolt.js";
import { storage } from "../storage";
import { Bridge } from "@shared/schema";
import { API } from "revolt-api";
import { Message } from "revolt.js";

export class RevoltBot {
  private client: Client;
  private ready: boolean = false;

  constructor(token: string) {
    storage.createLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Creating Revolt bot instance"
    });

    this.client = new Client();

    this.client.on("ready", async () => {
      this.ready = true;
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Revolt bot ready",
        metadata: { 
          username: this.client.user?.username,
          id: this.client.user?._id
        }
      });
    });

    this.client.on("error", (error: Error) => {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Revolt bot error",
        metadata: { error: error.message }
      });
    });

    try {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Attempting Revolt bot login"
      });

      this.client.loginBot(token).catch((error) => {
        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Revolt bot login failed",
          metadata: { error: error.message }
        });
      });
    } catch (error) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Revolt bot initialization failed",
        metadata: { error: (error as Error).message }
      });
    }
  }

  async sendMessage(channelId: string, content: string, options: { username?: string, avatarUrl?: string | null } = {}) {
    if (!this.ready) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Attempted to send message before Revolt bot was ready",
        metadata: { channelId }
      });
      throw new Error("Revolt bot not ready");
    }

    try {
      const channel = await this.client.channels.get(channelId);
      if (!channel || !("sendMessage" in channel)) {
        throw new Error("Invalid channel or missing permissions");
      }

      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Attempting to send Revolt message",
        metadata: { channelId, hasUsername: !!options.username }
      });

      const message = await channel.sendMessage({
        content,
        masquerade: options.username ? {
          name: options.username,
          avatar: options.avatarUrl || undefined
        } : undefined
      });

      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Successfully sent Revolt message",
        metadata: { messageId: message._id }
      });

      return message;
    } catch (error) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Failed to send Revolt message",
        metadata: { error: (error as Error).message, channelId }
      });
      throw error;
    }
  }

  onMessage(callback: (message: Message, bridge: Bridge) => Promise<void>) {
    this.client.on("message", async (message: Message) => {
      if (message.author?.bot) return;

      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Received Revolt message",
        metadata: { 
          messageId: message._id,
          channelId: message.channel?._id,
          authorId: message.author?._id 
        }
      });

      try {
        const bridges = await storage.getBridges();
        const bridge = bridges.find(b => b.revoltChannelId === message.channel?._id);

        if (bridge && bridge.enabled) {
          storage.createLog({
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Processing Revolt message for bridge",
            metadata: { bridgeId: bridge.id }
          });

          await callback(message, bridge);
        }
      } catch (error) {
        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Failed to process Revolt message",
          metadata: { error: (error as Error).message, messageId: message._id }
        });
      }
    });
  }
}