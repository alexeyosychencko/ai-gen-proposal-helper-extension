import { v } from "convex/values";
import { action, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// Types for intermediate results
interface JobExtraction {
	coreProblem: string;
	projectGoal: string; // What they ultimately want to achieve
	tools: string[]; // Tools mentioned (GHL, Zapier, etc)
	keyRequirements: string[];
	tone: "formal" | "casual" | "technical";
	personalizationHooks: string[];
}

interface TechnicalAnalysis {
	feasibility: string; // What can be implemented now vs needs info
	potentialRisks: string; // Potential issues or pitfalls
	solutionPlan: string; // Concrete technical approach
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
	handler: async (
		ctx,
		args
	): Promise<{
		proposal: string;
		context: string; // For regeneration
	}> => {
		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		// STEP 1: Extract & Personalize
		const jobExtraction = await extractJobDetails(openai, args.jobDescription);

		// STEP 2: RAG Search - Find Relevant CV Context
		const relevantExperience = await ctx.runAction(internal.proposals.searchRelevantCV, {
			userId: args.userId,
			jobDescription: args.jobDescription,
		});

		// STEP 3: Technical Analysis (Feasibility, Risks, Solution)
		const technicalAnalysis = await generateTechnicalAnalysis(openai, jobExtraction, relevantExperience);

		// STEP 4: Compose Proposal (Dalico Structure)
		const proposal = await composeProposal(
			openai,
			args.jobDescription,
			jobExtraction,
			relevantExperience,
			technicalAnalysis,
			args.userFeedback,
			args.previousProposal
		);

		// Save context for possible regeneration
		const context = JSON.stringify({
			jobExtraction,
			technicalAnalysis,
		});

		return {
			proposal,
			context,
		};
	},
});

// STEP 1: Extract job details + personalization hooks
async function extractJobDetails(openai: OpenAI, jobDescription: string): Promise<JobExtraction> {
	const completion = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{
				role: "system",
				content: `You are an expert at analyzing freelance job postings. Extract key information for the "Dalico" proposal method.

Focus on:
- Client's CORE problem and GOAL (what they want to achieve)
- Specific TOOLS mentioned (GoHighLevel, Zapier, Make, CRM, etc.)
- Specific details for personalization and context

Return JSON:
{
  "coreProblem": "client's main problem",
  "projectGoal": "ultimate goal (e.g. automate lead flow, reduce manual work)",
  "tools": ["Tool1", "Tool2"],
  "keyRequirements": ["req1", "req2"],
  "tone": "formal|casual|technical",
  "personalizationHooks": ["hook1", "hook2"]
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

// STEP 3: Generate Technical Analysis (Feasibility, Risks, Solution)
async function generateTechnicalAnalysis(
	openai: OpenAI,
	jobExtraction: JobExtraction,
	relevantExperience: string
): Promise<TechnicalAnalysis> {
	const completion = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{
				role: "system",
				content: `You are a senior technical freelancer. Analyze this job for a proposal.

Create a Technical Analysis containing:
1. Feasibility: What can be done immediately vs what needs clarification/access. Be realistic.
2. Potential Risks: Where might things go wrong? (API limits, data quality, legacy code). Show expertise.
3. Solution Plan: Specific, concrete technical steps. (e.g. "Create GHL workflow", "Use Zapier webhook"). NO generic "I will do this".

Return JSON:
{
  "feasibility": "text analyzing feasibility and constraints",
  "potentialRisks": "text identifying specific risks/issues",
  "solutionPlan": "text describing the concrete technical solution"
}`,
			},
			{
				role: "user",
				content: `Job Analysis:
${JSON.stringify(jobExtraction, null, 2)}

My Experience:
${relevantExperience}

Generate technical analysis.`,
			},
		],
		response_format: { type: "json_object" },
	});

	return JSON.parse(completion.choices[0].message.content!);
}

// STEP 4: Compose final proposal using Dalico Method
async function composeProposal(
	openai: OpenAI,
	jobDescription: string,
	jobExtraction: JobExtraction,
	relevantExperience: string,
	technicalAnalysis: TechnicalAnalysis,
	userFeedback?: string,
	previousProposal?: string
): Promise<string> {
	// STEP 4.1: Strategic Planning
	const outline = await createStrategicOutline(
		openai,
		jobDescription,
		jobExtraction,
		relevantExperience,
		technicalAnalysis,
		userFeedback,
		previousProposal
	);

	// STEP 4.2: Write the actual proposal
	const proposal = await writeProposalFromOutline(openai, jobDescription, jobExtraction, outline, relevantExperience);

	return proposal;
}

// STEP 4.1: Create strategic outline with Dalico Structure
interface ProposalOutline {
	taskBreakdown: string; // Analysis of the task
	feasibilityCheck: string; // What can be done / constraints
	riskAssessment: string; // Critical view on issues
	solutionPlan: string; // Concrete steps
	clarifyingQuestion: string; // The question
	experienceReference: string; // "Check similar work..."
}

async function createStrategicOutline(
	openai: OpenAI,
	jobDescription: string,
	jobExtraction: JobExtraction,
	relevantExperience: string,
	technicalAnalysis: TechnicalAnalysis,
	userFeedback?: string,
	previousProposal?: string
): Promise<ProposalOutline> {
	const systemPrompt = `You are a strategic proposal consultant using the "Dalico Method".
  
Structure logic:
1. Task Breakdown: Analyze goal & tools. Start with understanding, not "I can".
2. Feasibility: What is ready? What is missing? Constraints?
3. Risks: Show expertise by predicting issues.
4. Solution: Specific technical workflow/automation description.
5. Question: One specific question.
6. Experience: Reference specific past work from experience provided.

Return a strategic outline in JSON.`;

	const userPrompt = previousProposal
		? `RETHINK the proposal strategy based on this feedback:
${userFeedback}

Previous proposal:
${previousProposal}

Job: ${jobDescription}
Tools: ${jobExtraction.tools.join(", ")}
Context:
${JSON.stringify(technicalAnalysis, null, 2)}

Create a new Dalico strategic outline.`
		: `Create a strategic outline for a proposal (Dalico Method):

Job Description:
${jobDescription}

Extracted Info:
- Tools: ${jobExtraction.tools.join(", ")}
- Goal: ${jobExtraction.projectGoal}
- Details: ${jobExtraction.personalizationHooks.join(", ")}

Technical Analysis:
- Feasibility: ${technicalAnalysis.feasibility}
- Risks: ${technicalAnalysis.potentialRisks}
- Solution: ${technicalAnalysis.solutionPlan}

Experience to Reference:
${relevantExperience.substring(0, 500)}

Return JSON:
{
  "taskBreakdown": "analytical intro sentence(s)",
  "feasibilityCheck": "feasibility & constraints text",
  "riskAssessment": "potential issues text",
  "solutionPlan": "concrete solution text",
  "clarifyingQuestion": "one good question",
  "experienceReference": "sentence referencing specific similar project"
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

// STEP 4.2: Write the final proposal
async function writeProposalFromOutline(
	openai: OpenAI,
	jobDescription: string,
	jobExtraction: JobExtraction,
	outline: ProposalOutline,
	relevantExperience: string
): Promise<string> {
	const systemPrompt = `You are a professional freelancer. Write a proposal using the provided DALICO structure.

STRUCTURE (adhere strictly):
1. **Analysis**: Start immediately with understanding the task/goal. No "Hi", No "I can do this".
2. **Feasibility**: What you can do now vs what you need.
3. **Risks**: Potential issues (be honest/expert).
4. **Solution**: Concrete plan (use automation terms, workflow steps).
5. **Question**: The clarifying question.
6. **Experience**: "You can check similar work in my portfolio..."
7. **Sign-off**: "Best, [Name from CV]" (Extract name from experience, else use "Best, [Your Name]")

TONE & STYLE:
- Simple, human "freelancer" English.
- NO "rockstar", "ninja", "perfect fit".
- NO fluff.
- Max 1 emoji at start (optional).
- Total length: 2-4 short paragraphs.
- Format: Clean paragraphs, easy to read.`;

	const userPrompt = `Write the proposal based on this outline:
${JSON.stringify(outline, null, 2)}

Candidate Context (for name and style):
${relevantExperience.substring(0, 500)}

Ensure it flows naturally but keeps the structure.`;

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
		temperature: 0.7, // Slightly lower temp for more structured output
	});

	return completion.choices[0].message.content!;
}

// Optional: Separate query for match score (for UI)
export const calculateMatchScore = action({
	args: {
		userId: v.string(),
		jobDescription: v.string(),
	},
	handler: async (
		ctx,
		args
	): Promise<{
		score: number;
		strengths: string[];
		gaps: string[];
	}> => {
		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const relevantExperience = await ctx.runAction(internal.proposals.searchRelevantCV, {
			userId: args.userId,
			jobDescription: args.jobDescription,
		});

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
