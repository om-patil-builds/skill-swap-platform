const { GoogleGenerativeAI } = require("@google/generative-ai");

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildRoadmapPrompt(goal) {
  return `You are an expert tech career coach and curriculum designer.

A user wants to: "${goal}"

Generate a comprehensive, realistic, and personalized learning roadmap in STRICT JSON format.
Respond with ONLY valid JSON — no markdown, no code fences, no explanation text before or after.

The JSON must follow this exact structure:
{
  "objective": "One clear sentence describing what the learner will achieve",
  "duration": "e.g. 12 weeks / 3 months",
  "weeklyPlan": [
    {
      "week": 1,
      "title": "Short title for this week",
      "topics": ["Topic A", "Topic B", "Topic C"],
      "hours": 12
    }
  ],
  "miniProjects": [
    {
      "title": "Project Name",
      "description": "1-2 sentences describing the project",
      "tech": ["Tech1", "Tech2"]
    }
  ],
  "finalProject": {
    "title": "Capstone project title",
    "description": "2-3 sentences about the capstone project",
    "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
  },
  "interviewTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3",
    "Tip 4",
    "Tip 5"
  ],
  "resources": [
    {
      "title": "Resource Name",
      "url": "https://...",
      "type": "video"
    }
  ]
}

Rules:
- weeklyPlan must have between 8 and 16 entries
- miniProjects must have 3-5 entries
- interviewTips must have 5-8 entries
- resources must have 6-10 entries, each with a real URL
- resource type must be one of: video, article, docs, course, book, other
- hours per week must be realistic (8-20 range)
- Do NOT include any text outside the JSON object`;
}

// ─── JSON Extractor ───────────────────────────────────────────────────────────

function extractJSON(raw) {
  if (!raw || typeof raw !== "string") return null;

  // Strip markdown code fences if Gemini wraps in them
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(stripped);
  } catch {
    // Fallback: grab the first { ... } block
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────

function validateRoadmap(data) {
  if (!data || typeof data !== "object") return false;
  if (!data.objective || !data.duration) return false;
  if (!Array.isArray(data.weeklyPlan) || data.weeklyPlan.length < 1) return false;
  if (!data.finalProject || !data.finalProject.title) return false;
  return true;
}

// ─── Main Service Function ────────────────────────────────────────────────────

async function generateRoadmapWithGemini(goal) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey || apiKey.length < 10 || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is missing or invalid in .env");
  }

  const modelName = (process.env.GEMINI_MODEL || "gemini-flash-latest").trim();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const prompt = buildRoadmapPrompt(goal);

  console.log(`[RoadmapService] Generating roadmap for goal: "${goal}"`);

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  if (!raw || !raw.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsed = extractJSON(raw);

  if (!parsed) {
    console.error("[RoadmapService] Failed to parse JSON. Raw output:", raw.substring(0, 500));
    throw new Error("Failed to parse roadmap JSON from Gemini response.");
  }

  if (!validateRoadmap(parsed)) {
    throw new Error("Gemini roadmap response is missing required fields.");
  }

  // Sanitise / normalise arrays so they always exist
  parsed.weeklyPlan = Array.isArray(parsed.weeklyPlan) ? parsed.weeklyPlan : [];
  parsed.miniProjects = Array.isArray(parsed.miniProjects) ? parsed.miniProjects : [];
  parsed.interviewTips = Array.isArray(parsed.interviewTips) ? parsed.interviewTips : [];
  parsed.resources = Array.isArray(parsed.resources) ? parsed.resources : [];
  parsed.finalProject = parsed.finalProject || { title: "", description: "", features: [] };

  console.log("[RoadmapService] Roadmap generated successfully.");
  return parsed;
}

module.exports = { generateRoadmapWithGemini };
