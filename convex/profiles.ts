import { v } from "convex/values";
import { action, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// Action for generating embedding and saving CV
export const uploadCV = action({
  args: {
    userId: v.string(),
    cvText: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; profileId: string }> => {
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Generate embedding for CV
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: args.cvText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Save to database via internal mutation
    const profileId = await ctx.runMutation(internal.profiles.saveProfile, {
      userId: args.userId,
      cvText: args.cvText,
      embedding,
    });

    return { success: true, profileId };
  },
});

// Internal mutation for saving (only for calls from actions)
export const saveProfile = internalMutation({
  args: {
    userId: v.string(),
    cvText: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args): Promise<string> => {
    const now = Date.now();

    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing profile
      await ctx.db.patch(existing._id, {
        cvText: args.cvText,
        embedding: args.embedding,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("profiles", {
        userId: args.userId,
        cvText: args.cvText,
        embedding: args.embedding,
        createdAt: now,
        updatedAt: now,
      });
      return profileId;
    }
  },
});

// Query to get user profile
export const getProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});