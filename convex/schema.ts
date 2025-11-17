import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User CV - the main user data
  profiles: defineTable({
    userId: v.string(),
    cvText: v.string(),
    embedding: v.array(v.float64()), // Vector for similarity search
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // text-embedding-3-small
      filterFields: ["userId"],
    }),

  // Success proposals - lib for success proposal style
  successfulProposals: defineTable({
    userId: v.string(),
    jobDescription: v.string(), // For context - which job position
    proposalText: v.string(), // Text of the successful proposal
    embedding: v.array(v.float64()), // Proposal vector for finding similar ones
    notes: v.optional(v.string()), // Additional notes (why successful, etc.)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId"],
    }),
});