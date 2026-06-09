import type { ContentMessage } from "../utils/types";

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  main() {
    console.log("YouTube Remote Content Script Injected");

    browser.runtime.onMessage.addListener((message: any) => {
      const msg = message as ContentMessage;
      if (msg.type !== "EXECUTE_ACTION") return;

      console.log("Executing action:", msg.action);

      const video = document.querySelector("video");

      switch (msg.action) {
        case "PLAY":
          video?.play();
          break;
        case "PAUSE":
          video?.pause();
          break;
        case "NEXT":
          (document.querySelector(".ytp-next-button") as HTMLElement)?.click();
          break;
        case "PREV":
          (document.querySelector(".ytp-prev-button") as HTMLElement)?.click();
          break;
        case "OPEN_LINK":
          if (msg.url) {
            if (msg.openLinkBehavior === "CURRENT_TAB" || msg.openLinkBehavior === "NEW_TAB_IF_NO_ACTIVE") {
              window.location.href = msg.url;
            } else if (msg.openLinkBehavior === "ALWAYS_NEW_TAB") {
              // The background script should handle this ideally, but just in case:
              window.open(msg.url, "_blank");
            }
          }
          break;
      }
    });
  },
});
