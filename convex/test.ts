import { query } from "./_generated/server";

export const getWelcomeMessage = query({
  handler: async () => {
    return {
      message: "Convex Connected! 🎉",
      timestamp: Date.now()
    };
  },
});