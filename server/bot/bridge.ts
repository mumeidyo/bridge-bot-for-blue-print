import { DiscordBot } from "./discord";
import { RevoltBot } from "./revolt";
import { IStorage } from "../storage";
import { Bridge } from "@shared/schema";
import { Message as RevoltMessage } from "revolt.js";
import { Message as DiscordMessage } from "discord.js";

let discordBot: DiscordBot | null = null;
let revoltBot: RevoltBot | null = null;

export async function initializeBridge(storage: IStorage) {
  try {
    const settings = await storage.getSettings();

    storage.createLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Attempting to initialize bridge with settings",
      metadata: {
        discordTokenPresent: !!settings.discordToken,
        revoltTokenPresent: !!settings.revoltToken
      }
    });

    if (!settings.discordToken || !settings.revoltToken) {
      storage.createLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Bot tokens not configured",
        metadata: {
          discordTokenSet: !!settings.discordToken,
          revoltTokenSet: !!settings.revoltToken
        }
      });
      return;
    }

    discordBot = new DiscordBot(settings.discordToken);
    revoltBot = new RevoltBot(settings.revoltToken);

    discordBot.onMessage(async (message: DiscordMessage, bridge: Bridge) => {
      if (!bridge.enabled || !revoltBot) return;

      try {
        const masquerades = await storage.getMasquerades(bridge.id);
        const masquerade = masquerades.find(m => m.userId === message.author.id);

        // Get reference message if it's a reply
        const replyToId = message.reference?.messageId;

        await revoltBot.sendMessage(
          bridge.revoltChannelId,
          message.content,
          {
            username: masquerade?.username || message.author.username,
            avatarUrl: masquerade?.avatar || message.author.displayAvatarURL(),
            replyToId: replyToId
          }
        );

        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Successfully relayed Discord message to Revolt",
          metadata: { 
            messageId: message.id,
            isReply: !!replyToId
          }
        });
      } catch (error) {
        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Failed to relay Discord message to Revolt",
          metadata: { error: (error as Error).message, messageId: message.id }
        });
      }
    });

    revoltBot.onMessage(async (message: RevoltMessage, bridge: Bridge) => {
      if (!bridge.enabled || !discordBot || !message.author) return;

      try {
        let avatarUrl: string | null = null;
        if (message.author.avatar?._id) {
          avatarUrl = `https://autumn.revolt.chat/avatars/${message.author.avatar._id}`;
        }

        const masquerades = await storage.getMasquerades(bridge.id);
        const masquerade = masquerades.find(m => m.userId === message.author._id);

        const username = masquerade?.username || message.author.username;

        // Get reference message if it's a reply
        const replyToId = message.reply_ids?.[0];

        await discordBot.sendMessage(
          bridge.discordChannelId,
          message.content || "",
          {
            username: username,
            avatarUrl: masquerade?.avatar || avatarUrl,
            replyToId: replyToId
          }
        );

        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Successfully relayed Revolt message to Discord",
          metadata: { 
            messageId: message._id,
            isReply: !!replyToId
          }
        });
      } catch (error) {
        storage.createLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "Failed to relay Revolt message to Discord",
          metadata: { error: (error as Error).message, messageId: message._id }
        });
      }
    });

    await storage.clearErrorLogs();

    storage.createLog({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Bridge initialized successfully"
    });
  } catch (error) {
    storage.createLog({
      timestamp: new Date().toISOString(),
      level: "error",
      message: "Failed to initialize bridge",
      metadata: { error: (error as Error).message }
    });
  }
}
