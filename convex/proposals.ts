import { v } from "convex/values";
import { action, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// Types for intermediate results
interface JobExtraction {
  coreProblem: string; // In client's words
  keyRequirements: string[];
  mustHaveSkills: string[];
  tone: "formal" | "casual" | "technical";
  personalizationHooks: string[]; // Specific details for personalization
  clientPriorities: string[];
}

interface MethodologyPlan {
  approach: string; // Overall approach
  steps: string[]; // Concrete steps
  deliverables: string[];
  timeline?: string;
}

// Main action for generating proposal
export const generateProposal = action({
  args: {
    userId: v.string(),
    jobDescription: v.string(),
    userFeedback: v.optional(v.string()), // For regeneration
    previousProposal: v.optional(v.string()),
    previousContext: v.optional(v.string()), // Save context
  },
  handler: async (ctx, args): Promise<{
    proposal: string;
    context: string; // For regeneration
  }> => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // STEP 1: Extract & Personalize
    const jobExtraction = await extractJobDetails(openai, args.jobDescription);

    // STEP 2: RAG Search - Find Relevant CV Context
    const relevantExperience = await ctx.runAction(
      internal.proposals.searchRelevantCV,
      {
        userId: args.userId,
        jobDescription: args.jobDescription,
      }
    );

    // STEP 3: Generate Methodology
    const methodology = await generateMethodology(
      openai,
      jobExtraction,
      relevantExperience
    );

    // STEP 4: Compose Proposal (AIDA/PAS structure)
    const proposal = await composeProposal(
      openai,
      args.jobDescription,
      jobExtraction,
      relevantExperience,
      methodology,
      args.userFeedback,
      args.previousProposal
    );

    // Save context for possible regeneration
    const context = JSON.stringify({
      jobExtraction,
      methodology,
    });

    return {
      proposal,
      context,
    };
  },
});

// STEP 1: Extract job details + personalization hooks
async function extractJobDetails(
  openai: OpenAI,
  jobDescription: string
): Promise<JobExtraction> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert at analyzing freelance job postings. Extract key information for writing a winning personalized proposal.

Focus on:
- Client's CORE problem (use their exact words when possible)
- Must-have requirements and skills
- Communication tone they prefer
- Specific details that can be used for personalization (company name, industry, specific pain points, unique aspects)
- What client values most

Return JSON with this structure:
{
  "coreProblem": "client's main problem in their words",
  "keyRequirements": ["requirement 1", "requirement 2"],
  "mustHaveSkills": ["skill 1", "skill 2"],
  "tone": "formal|casual|technical",
  "personalizationHooks": ["specific detail 1", "unique aspect 2"],
  "clientPriorities": ["what matters most", "secondary priority"]
}`,
      },
      {
        role: "user",
        content: jobDescription,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content!);
}

// STEP 2: Vector search for relevant experience
export const searchRelevantCV = internalAction({
  args: {
    userId: v.string(),
    jobDescription: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate embedding for job
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: args.jobDescription,
    });

    const jobEmbedding = embeddingResponse.data[0].embedding;

    // Vector search through CV
    const results = await ctx.vectorSearch("profiles", "by_embedding", {
      vector: jobEmbedding,
      limit: 1,
      filter: (q) => q.eq("userId", args.userId),
    });

    if (results.length === 0) {
      throw new Error("CV not found. Please upload your CV first.");
    }

    // Get full document from database
    const profile = await ctx.runQuery(internal.proposals.getProfileById, {
      profileId: results[0]._id,
    });

    if (!profile) {
      throw new Error("CV not found.");
    }

    return profile.cvText;
  },
});

// Helper query to get profile by ID
export const getProfileById = internalQuery({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

// STEP 3: Generate methodology - how exactly you'll solve the problem
async function generateMethodology(
  openai: OpenAI,
  jobExtraction: JobExtraction,
  relevantExperience: string
): Promise<MethodologyPlan> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert freelancer creating a project approach plan.

Based on the job requirements and candidate's experience, create a clear step-by-step methodology that shows:
- Professional understanding of the project
- Concrete approach to solving the problem
- Specific deliverables
- Realistic timeline (if possible to estimate)

Return JSON:
{
  "approach": "overall approach description",
  "steps": ["step 1", "step 2", "step 3"],
  "deliverables": ["deliverable 1", "deliverable 2"],
  "timeline": "estimated timeline if applicable"
}

Keep it concise but specific. Show competence without over-promising.`,
      },
      {
        role: "user",
        content: `Job Requirements:
${JSON.stringify(jobExtraction, null, 2)}

Candidate's Relevant Experience:
${relevantExperience}

Create a methodology plan for this project.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content!);
}

// STEP 4: Compose final proposal using multi-step reasoning (AIDA/PAS structure)
async function composeProposal(
  openai: OpenAI,
  jobDescription: string,
  jobExtraction: JobExtraction,
  relevantExperience: string,
  methodology: MethodologyPlan,
  userFeedback?: string,
  previousProposal?: string
): Promise<string> {
  // STEP 4.1: Strategic Planning - Think through the best approach
  const outline = await createStrategicOutline(
    openai,
    jobDescription,
    jobExtraction,
    relevantExperience,
    methodology,
    userFeedback,
    previousProposal
  );

  // STEP 4.2: Write the actual proposal using the strategic outline
  const proposal = await writeProposalFromOutline(
    openai,
    jobDescription,
    jobExtraction,
    outline
  );

  return proposal;
}

// STEP 4.1: Create strategic outline with reasoning
interface ProposalOutline {
  hookStrategy: string; // Which personalization angle to use and why
  selectedHook: string; // The actual hook text
  problemRestatement: string; // How to restate their problem
  valueProposition: string; // Key points for "why me" section
  keyExperiencePoints: string[]; // Specific experience to highlight
  methodologyPresentation: string; // How to present the approach
  callToAction: string; // The closing CTA
  reasoning: string; // Overall strategic reasoning
}

async function createStrategicOutline(
  openai: OpenAI,
  jobDescription: string,
  jobExtraction: JobExtraction,
  relevantExperience: string,
  methodology: MethodologyPlan,
  userFeedback?: string,
  previousProposal?: string
): Promise<ProposalOutline> {
  const systemPrompt = `You are a strategic proposal consultant. Your job is to THINK THROUGH the best approach before writing.

Analyze the job, client priorities, and available experience to create a winning strategy.

Consider:
- Which personalization hook will resonate most?
- What problem restatement will show deep understanding?
- Which experience points are most relevant (avoid CV dumping)?
- How to present methodology to address their priorities?
- What tone and style will work best?

Return a strategic outline in JSON format with your reasoning.`;

  const userPrompt = previousProposal
    ? `RETHINK the proposal strategy based on this feedback:
${userFeedback}

Previous proposal:
${previousProposal}

Job Context:
Core Problem: ${jobExtraction.coreProblem}
Personalization Hooks: ${jobExtraction.personalizationHooks.join(", ")}
Client Priorities: ${jobExtraction.clientPriorities.join(", ")}
Tone: ${jobExtraction.tone}

Create a new strategic outline that addresses the feedback.`
    : `Create a strategic outline for an Upwork proposal:

Job Description:
${jobDescription}

Extracted Details:
- Core Problem: ${jobExtraction.coreProblem}
- Key Requirements: ${jobExtraction.keyRequirements.join(", ")}
- Personalization Hooks: ${jobExtraction.personalizationHooks.join(", ")}
- Client Priorities: ${jobExtraction.clientPriorities.join(", ")}
- Tone: ${jobExtraction.tone}

Candidate's Experience:
${relevantExperience.substring(0, 1000)}...

Methodology:
Approach: ${methodology.approach}
Steps: ${methodology.steps.join(" → ")}

Think through the best strategy and return JSON:
{
  "hookStrategy": "reasoning for which personalization angle to use",
  "selectedHook": "the actual hook text (1-2 sentences)",
  "problemRestatement": "how to restate their problem empathetically",
  "valueProposition": "key 'why me' message",
  "keyExperiencePoints": ["specific point 1", "specific point 2"],
  "methodologyPresentation": "how to present the approach",
  "callToAction": "the closing CTA",
  "reasoning": "overall strategic thinking"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  return JSON.parse(completion.choices[0].message.content!);
}

// STEP 4.2: Write the final proposal from the strategic outline
async function writeProposalFromOutline(
  openai: OpenAI,
  jobDescription: string,
  jobExtraction: JobExtraction,
  outline: ProposalOutline
): Promise<string> {
  const systemPrompt = `You are an expert Upwork proposal writer with 40% response rate.

Write proposals that WIN using AIDA/PAS framework:

STRUCTURE:
1. PERSONALIZED HOOK (use the provided hook)
2. RESTATE THEIR PROBLEM (use provided restatement)
3. "I CAN HELP" + WHY ME (use provided value prop and experience points)
4. HOW I'LL DO IT (use provided methodology presentation)
5. CLEAR NEXT STEP (use provided CTA)

TONE: ${jobExtraction.tone}

CRITICAL RULES:
- Keep it concise (3 short paragraphs max)
- NO fluff or filler
- NO weak phrases: "I think", "I believe", "I should be able to"
- Be confident and specific
- Focus on THEIR needs, not your credentials
- Show, don't tell
- Write naturally - don't sound like a template`;

  const userPrompt = `Write a winning Upwork proposal using this strategic outline:

STRATEGIC OUTLINE:
${JSON.stringify(outline, null, 2)}

Job Description (for context):
${jobDescription}

Write the complete proposal as natural, flowing text (not bullet points or sections).
Make it conversational and compelling. Follow the AIDA structure but make it feel personal and authentic.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.8,
  });

  return completion.choices[0].message.content!;
}

// Optional: Separate query for match score (for UI)
export const calculateMatchScore = action({
  args: {
    userId: v.string(),
    jobDescription: v.string(),
  },
  handler: async (ctx, args): Promise<{
    score: number;
    strengths: string[];
    gaps: string[];
  }> => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const relevantExperience = await ctx.runAction(
      internal.proposals.searchRelevantCV,
      {
        userId: args.userId,
        jobDescription: args.jobDescription,
      }
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analyze how well the candidate matches the job. Return JSON:
{
  "score": 0-100,
  "strengths": ["what makes them strong"],
  "gaps": ["what they might be missing"]
}`,
        },
        {
          role: "user",
          content: `Job: ${args.jobDescription}\n\nCV: ${relevantExperience}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content!);
  },
});