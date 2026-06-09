import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  commands: defineTable({
    roomId: v.string(),
    action: v.union(
      v.literal("PLAY"),
      v.literal("PAUSE"),
      v.literal("NEXT"),
      v.literal("PREV"),
      v.literal("OPEN_LINK")
    ),
    url: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_roomId_timestamp", ["roomId", "timestamp"]),
});
