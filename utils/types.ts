export type ActionType = "PLAY" | "PAUSE" | "NEXT" | "PREV" | "OPEN_LINK";

export interface ExtensionConfig {
  roomId: string;
  enabled: boolean;
  openLinkBehavior: "CURRENT_TAB" | "NEW_TAB_IF_NO_ACTIVE" | "ALWAYS_NEW_TAB";
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  roomId: "dev-room",
  enabled: true,
  openLinkBehavior: "NEW_TAB_IF_NO_ACTIVE",
};

export interface BackgroundMessage {
  type: "TEST_ACTION";
  action: ActionType;
  url?: string;
}

export interface ContentMessage {
  type: "EXECUTE_ACTION";
  action: ActionType;
  url?: string;
  openLinkBehavior: ExtensionConfig["openLinkBehavior"];
}
