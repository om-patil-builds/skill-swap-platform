const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

// ─── Extract Text from File Buffer or String ──────────────────────────────────

async function extractResumeText({ buffer, mimetype, rawText }) {
  if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
    return rawText.trim();
  }

  if (!buffer) {
    throw new Error("No resume text or file provided.");
  }

  if (mimetype === "application/pdf" || mimetype?.includes("pdf")) {
    const parsed = await pdfParse(buffer);
    const text = (parsed.text || "").trim();
    if (!text) {
      throw new Error("Could not extract readable text from PDF file.");
    }
    return text;
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype?.includes("word") ||
    mimetype?.includes("docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || "").trim();
    if (!text) {
      throw new Error("Could not extract readable text from DOCX file.");
    }
    return text;
  }

  // Fallback: try reading buffer as utf-8 plain text
  const text = buffer.toString("utf-8").trim();
  if (!text) {
    throw new Error("Unsupported file type or empty file content.");
  }
  return text;
}

// ─── Build Prompt ─────────────────────────────────────────────────────────────

function buildResumePrompt(resumeText) {
  return `You are an expert HR Executive, ATS Optimization Specialist, and Senior Tech Recruiter.

Analyze the following resume thoroughly:

--- BEGIN RESUME ---
${resumeText.substring(0, 12000)}
--- END RESUME ---

Perform a deep evaluation and generate a detailed report in STRICT JSON format.
Respond ONLY with valid JSON — no markdown code blocks, no explanations before or after.

The JSON structure MUST follow this exact format:
{
  "score": 78,
  "strengths": [
    "Highlight specific strength 1",
    "Highlight specific strength 2",
    "Highlight specific strength 3"
  ],
  "weaknesses": [
    "Specific area of improvement 1",
    "Specific area of improvement 2"
  ],
  "missingTechnicalSkills": [
    "Technical skill 1",
    "Technical skill 2"
  ],
  "missingSoftSkills": [
    "Soft skill 1",
    "Soft skill 2"
  ],
  "atsSuggestions": [
    "ATS formatting or keyword tip 1",
    "ATS tip 2",
    "ATS tip 3"
  ],
  "recommendedProjects": [
    {
      "title": "Project Title",
      "description": "Brief description of the project to add to resume",
      "techStack": ["React", "Node.js", "MongoDB"]
    }
  ],
  "resumeTips": [
    "Actionable tip to improve resume impact 1",
    "Actionable tip 2",
    "Actionable tip 3"
  ],
  "suggestedRoles": [
    "Target Role 1",
    "Target Role 2",
    "Target Role 3"
  ]
}

Evaluation Criteria:
- score: Integer between 0 and 100 representing overall quality, impact, and ATS readability.
- strengths: 3-5 key achievements, clear metrics, or formatting wins.
- weaknesses: 2-4 gaps, passive phrasing, or layout issues.
- missingTechnicalSkills: Relevant industry tools, frameworks, or languages that would elevate candidate competitiveness.
- missingSoftSkills: Key soft skills or leadership traits that appear omitted.
- atsSuggestions: 3-5 ATS optimization tips (formatting, standard headers, keyword density, section ordering).
- recommendedProjects: 2-3 specific portfolio project ideas tailored to fill their skill gaps.
- resumeTips: 3-5 actionable bullet-point improvements (action verbs, quantifiable results, contact info).
- suggestedRoles: 3-5 specific job titles the candidate is best qualified for.
- Ensure all suggestions are tailored specifically to the provided resume text.`;
}

// ─── Extract & Parse JSON safely ─────────────────────────────────────────────

function parseJSONResponse(rawText) {
  if (!rawText || typeof rawText !== "string") return null;

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
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

// ─── Main Service Handler ─────────────────────────────────────────────────────

async function analyzeResumeWithGemini(input) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey || apiKey.length < 10 || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is missing or invalid in .env");
  }

  const resumeText = await extractResumeText(input);

  if (resumeText.length < 50) {
    throw new Error("Resume content is too short for a meaningful analysis (minimum 50 characters).");
  }

  const modelName = (process.env.GEMINI_MODEL || "gemini-flash-latest").trim();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  });

  const prompt = buildResumePrompt(resumeText);

  console.log(`[GeminiResumeService] Analyzing resume (${resumeText.length} chars)...`);
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  if (!raw || !raw.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsed = parseJSONResponse(raw);

  if (!parsed || typeof parsed !== "object") {
    console.error("[GeminiResumeService] Failed to parse response:", raw.substring(0, 500));
    throw new Error("Failed to parse resume analysis JSON from Gemini.");
  }

  // Normalisation
  const score = typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 70;

  return {
    score,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    missingTechnicalSkills: Array.isArray(parsed.missingTechnicalSkills) ? parsed.missingTechnicalSkills : [],
    missingSoftSkills: Array.isArray(parsed.missingSoftSkills) ? parsed.missingSoftSkills : [],
    atsSuggestions: Array.isArray(parsed.atsSuggestions) ? parsed.atsSuggestions : [],
    recommendedProjects: Array.isArray(parsed.recommendedProjects) ? parsed.recommendedProjects : [],
    resumeTips: Array.isArray(parsed.resumeTips) ? parsed.resumeTips : [],
    suggestedRoles: Array.isArray(parsed.suggestedRoles) ? parsed.suggestedRoles : [],
  };
}

module.exports = { analyzeResumeWithGemini, extractResumeText };
