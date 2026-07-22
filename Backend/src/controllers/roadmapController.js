const Roadmap = require("../models/roadmap.model");
const { generateRoadmapWithGemini } = require("../services/geminiRoadmapService");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function handleGeminiError(error, res) {
  console.error("[RoadmapController] Error:", error?.message);

  const msg = (error?.message || "").toLowerCase();
  const status = error?.status ?? error?.httpStatusCode ?? null;

  if (msg.includes("missing or invalid")) {
    return res.status(500).json({ error: "Gemini API key is not configured. Check your .env file." });
  }
  if (msg.includes("api_key_invalid") || msg.includes("api key not valid")) {
    return res.status(401).json({ error: "Invalid Gemini API key. Update GEMINI_API_KEY in .env and restart." });
  }
  if (status === 429 || msg.includes("quota") || msg.includes("rate limit")) {
    return res.status(429).json({ error: "Gemini rate limit reached. Please wait a moment and try again." });
  }
  if (status === 403 || msg.includes("permission") || msg.includes("forbidden")) {
    return res.status(403).json({ error: "API key doesn't have permission. Check your Gemini API key." });
  }
  if (msg.includes("failed to parse") || msg.includes("missing required fields")) {
    return res.status(502).json({ error: "AI returned an unexpected format. Please try again." });
  }

  return res.status(500).json({ error: "Roadmap generation failed. Please try again." });
}

// ─── Generate Roadmap (Gemini, not saved) ─────────────────────────────────────

exports.generateRoadmap = async (req, res) => {
  try {
    const { goal } = req.body;

    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return res.status(400).json({ error: "Learning goal is required." });
    }
    if (goal.trim().length > 300) {
      return res.status(400).json({ error: "Goal is too long (max 300 characters)." });
    }

    const roadmap = await generateRoadmapWithGemini(goal.trim());

    return res.status(200).json({ roadmap, goal: goal.trim() });
  } catch (error) {
    return handleGeminiError(error, res);
  }
};

// ─── Save Roadmap to MongoDB ───────────────────────────────────────────────────

exports.saveRoadmap = async (req, res) => {
  try {
    const { goal, roadmap } = req.body;

    if (!goal || !roadmap) {
      return res.status(400).json({ error: "Goal and roadmap data are required." });
    }

    // Prevent duplicate saves for the exact same goal per user
    const existing = await Roadmap.findOne({
      userId: req.user.id,
      goal: goal.trim(),
    });

    if (existing) {
      return res.status(409).json({ error: "You already saved a roadmap for this goal." });
    }

    const saved = await Roadmap.create({
      userId: req.user.id,
      goal: goal.trim(),
      objective: roadmap.objective || "",
      duration: roadmap.duration || "",
      weeklyPlan: roadmap.weeklyPlan || [],
      miniProjects: roadmap.miniProjects || [],
      finalProject: roadmap.finalProject || {},
      interviewTips: roadmap.interviewTips || [],
      resources: roadmap.resources || [],
    });

    console.log(`[RoadmapController] Roadmap saved for user ${req.user.id}, goal: "${goal}"`);
    return res.status(201).json({ message: "Roadmap saved successfully!", roadmap: saved });
  } catch (error) {
    console.error("[RoadmapController] Save error:", error?.message);
    return res.status(500).json({ error: "Failed to save roadmap." });
  }
};

// ─── Get All Roadmaps for Current User ────────────────────────────────────────

exports.getUserRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("goal objective duration createdAt _id");

    return res.status(200).json({ roadmaps });
  } catch (error) {
    console.error("[RoadmapController] Fetch error:", error?.message);
    return res.status(500).json({ error: "Failed to fetch roadmaps." });
  }
};

// ─── Get a Single Roadmap (full) ──────────────────────────────────────────────

exports.getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found." });
    }

    return res.status(200).json({ roadmap });
  } catch (error) {
    console.error("[RoadmapController] GetById error:", error?.message);
    return res.status(500).json({ error: "Failed to fetch roadmap." });
  }
};

// ─── Delete a Roadmap ─────────────────────────────────────────────────────────

exports.deleteRoadmap = async (req, res) => {
  try {
    const deleted = await Roadmap.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // ensures users can only delete their own
    });

    if (!deleted) {
      return res.status(404).json({ error: "Roadmap not found or already deleted." });
    }

    console.log(`[RoadmapController] Deleted roadmap ${req.params.id} for user ${req.user.id}`);
    return res.status(200).json({ message: "Roadmap deleted successfully." });
  } catch (error) {
    console.error("[RoadmapController] Delete error:", error?.message);
    return res.status(500).json({ error: "Failed to delete roadmap." });
  }
};
