import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

import {
  DEFAULT_CONFIG,
  type ExtensionConfig,
  type ContentMessage,
  type BackgroundMessage,
  type ActionType,
} from "../utils/types";

export default defineBackground(() => {
  console.log("YouTube Remote Background Script Initialized");

  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;
  if (!CONVEX_URL) {
    console.error("Missing VITE_CONVEX_URL in environment variables!");
  }

  const client = new ConvexClient(CONVEX_URL || "");

  let lastExecutedTimestamp = 0;
  let unsubscribe: (() => void) | null = null;
  let currentConfig: ExtensionConfig = { ...DEFAULT_CONFIG };

  // Keep-alive loop to prevent Manifest V3 from suspending
  browser.alarms.create("keepAlive", { periodInMinutes: 0.5 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keepAlive") {
      console.log("Keep-alive pulse");
    }
  });

  const forwardActionToYouTube = async (action: ActionType, url?: string) => {
    try {
      const tabs = await browser.tabs.query({ url: "*://*.youtube.com/*" });
      const message: ContentMessage = {
        type: "EXECUTE_ACTION",
        action,
        url,
        openLinkBehavior: currentConfig.openLinkBehavior,
      };

      if (
        action === "OPEN_LINK" &&
        url &&
        currentConfig.openLinkBehavior === "ALWAYS_NEW_TAB"
      ) {
        await browser.tabs.create({ url });
        console.log(`Opened new tab for ${url}`);
        return;
      }

      if (tabs.length > 0) {
        // Send to the first active YouTube tab
        const targetTab = tabs.find((t) => t.active) || tabs[0];
        if (targetTab.id) {
          await browser.tabs.sendMessage(targetTab.id, message);
          console.log(`Forwarded action ${action} to tab ${targetTab.id}`);
        }
      } else {
        // No YouTube tab found
        console.log("No YouTube tabs found");
        if (action === "OPEN_LINK" && url) {
          if (
            currentConfig.openLinkBehavior === "NEW_TAB_IF_NO_ACTIVE" ||
            currentConfig.openLinkBehavior === "ALWAYS_NEW_TAB"
          ) {
            await browser.tabs.create({ url });
          }
        }
      }
    } catch (err) {
      console.error("Failed to forward action:", err);
    }
  };

  const setupConvexSubscription = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    if (!currentConfig.enabled || !currentConfig.roomId) {
      console.log(
        "Extension is disabled or no roomId set. Subscription stopped.",
      );
      return;
    }

    if (!CONVEX_URL) return;

    console.log(
      `Setting up Convex subscription for room: ${currentConfig.roomId}`,
    );
    unsubscribe = client.onUpdate(
      api.commands.getLatest,
      { roomId: currentConfig.roomId },
      (command) => {
        if (!command) return;

        if (command.timestamp > lastExecutedTimestamp) {
          console.log("Received new command:", command);
          lastExecutedTimestamp = command.timestamp;
          forwardActionToYouTube(command.action, command.url);
        }
      },
    );
  };

  const loadConfigAndSubscribe = async () => {
    const config = await storage.getItem<ExtensionConfig>("local:config");
    if (config) {
      currentConfig = { ...DEFAULT_CONFIG, ...config };
    } else {
      await storage.setItem("local:config", currentConfig);
    }
    setupConvexSubscription();
  };

  // Watch for config changes (e.g. from the popup)
  storage.watch<ExtensionConfig>("local:config", (newConfig, oldConfig) => {
    if (newConfig) {
      currentConfig = { ...DEFAULT_CONFIG, ...newConfig };
      if (
        oldConfig?.roomId !== newConfig.roomId ||
        oldConfig?.enabled !== newConfig.enabled
      ) {
        setupConvexSubscription();
      }
    }
  });

  // Listen for manual tests from Popup
  browser.runtime.onMessage.addListener(
    (message: BackgroundMessage, sender, sendResponse) => {
      if (message.type === "TEST_ACTION") {
        console.log("Received manual test action:", message);
        forwardActionToYouTube(message.action, message.url);
        sendResponse({ success: true });
      }
    },
  );

  // Initial load
  loadConfigAndSubscribe();
});
