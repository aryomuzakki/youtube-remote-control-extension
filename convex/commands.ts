import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getLatest = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commands")
      .withIndex("by_roomId_timestamp", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .first();
  },
});

export const pushCommand = mutation({
  args: {
    roomId: v.string(),
    action: v.union(
      v.literal("PLAY"),
      v.literal("PAUSE"),
      v.literal("NEXT"),
      v.literal("PREV"),
      v.literal("OPEN_LINK")
    ),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    await ctx.db.insert("commands", {
      roomId: args.roomId,
      action: args.action,
      url: args.url,
      timestamp,
    });
  },
});
