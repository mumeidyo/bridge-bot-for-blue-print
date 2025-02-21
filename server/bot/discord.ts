import { Client, GatewayIntentBits, TextChannel, Message, WebhookClient, ChannelType } from "discord.js";
import { storage } from "../storage";
import { Bridge } from "@shared/schema";

export class DiscordBot {
  private client: Client;
  private webhooks: Map<string, WebhookClient> = new Map();
  private ready: boolean = false;

  constructor(token: string) {
    storage.createLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Creating Discord bot instance"
    });

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.client.on("ready", () => {
      this.ready = true;
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Discord bot ready",
        metadata: { 
          username: this.client.user?.tag,
          id: this.client.user?.id
        }
      });
    });

    this.client.on("error", (error) => {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Discord bot error",
        metadata: { error: error.message }
      });
    });

    try {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Attempting Discord bot login"
      });

      this.client.login(token).catch((error) => {
        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Discord bot login failed",
          metadata: { error: error.message }
        });
      });
    } catch (error) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Discord bot initialization failed",
        metadata: { error: (error as Error).message }
      });
    }
  }

  private async getWebhook(channelId: string): Promise<WebhookClient | null> {
    try {
      if (this.webhooks.has(channelId)) {
        return this.webhooks.get(channelId) || null;
      }

      const channel = await this.client.channels.fetch(channelId);
      if (!(channel instanceof TextChannel)) {
        throw new Error("Invalid channel type");
      }

      const webhooks = await channel.fetchWebhooks();
      let webhook = webhooks.find(wh => wh.owner?.id === this.client.user?.id);

      if (!webhook) {
        webhook = await channel.createWebhook({
          name: "Bridge Bot",
          avatar: this.client.user?.displayAvatarURL()
        });
      }

      const webhookClient = new WebhookClient({ url: webhook.url });
      this.webhooks.set(channelId, webhookClient);

      return webhookClient;
    } catch (error) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Failed to get webhook",
        metadata: { error: (error as Error).message, channelId }
      });
      return null;
    }
  }

  async sendMessage(channelId: string, content: string, options: { 
    username?: string, 
    avatarUrl?: string | null,
    replyToId?: string  
  } = {}) {
    if (!this.ready) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Attempted to send message before Discord bot was ready",
        metadata: { channelId }
      });
      throw new Error("Discord bot not ready");
    }

    try {
      const webhook = await this.getWebhook(channelId);
      let messageContent = content;
      let messageReference = null;

      if (options.replyToId) {
        try {
          const channel = await this.client.channels.fetch(channelId);
          if (channel instanceof TextChannel) {
            const replyMessage = await channel.messages.fetch(options.replyToId);
            if (replyMessage) {
              messageReference = replyMessage;
              messageContent = `> **${replyMessage.author.username}:** ${replyMessage.content.split('\n')[0]}\n${content}`;
            }
          }
        } catch (error) {
          storage.createLog({
            timestamp: new Date().toISOString(),
            level: "warn",
            message: "Failed to fetch reply message",
            metadata: { error: (error as Error).message, replyToId: options.replyToId }
          });
        }
      }

      if (webhook && options.username) {
        const webhookMessage = await webhook.send({
          content: messageContent,
          username: options.username,
          avatarURL: options.avatarUrl || undefined,
          allowedMentions: { parse: [] },
          threadId: messageReference?.threadId
        });

        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Successfully sent Discord message via webhook",
          metadata: { 
            messageId: webhookMessage.id,
            webhookId: webhookMessage.webhook_id,
            username: options.username,
            channelId,
            isReply: !!options.replyToId
          }
        });

        return webhookMessage;
      } else {
        const channel = await this.client.channels.fetch(channelId);
        if (!(channel instanceof TextChannel)) {
          throw new Error("Invalid channel type");
        }

        const messageOptions: any = {
          content: messageContent,
          allowedMentions: { parse: [] }
        };

        if (messageReference) {
          messageOptions.reply = { messageReference: messageReference.id };
        }

        const message = await channel.send(messageOptions);

        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Successfully sent Discord message via bot",
          metadata: { 
            messageId: message.id,
            isReply: !!options.replyToId
          }
        });

        return message;
      }
    } catch (error) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Failed to send Discord message",
        metadata: { error: (error as Error).message, channelId }
      });
      throw error;
    }
  }

  onMessage(callback: (message: Message, bridge: Bridge) => Promise<void>) {
    this.client.on("messageCreate", async (message) => {
      if (message.author.bot) return;

      try {
        const bridges = await storage.getBridges();
        const bridge = bridges.find(b => b.discordChannelId === message.channelId && b.enabled);

        if (bridge) {
          await callback(message, bridge);
        }
      } catch (error) {
        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Failed to process Discord message",
          metadata: { error: (error as Error).message, messageId: message.id }
        });
      }
    });
  }
}
