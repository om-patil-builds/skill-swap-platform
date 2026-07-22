const ResumeReview = require("../models/resumeReview.model");
const { analyzeResumeWithGemini } = require("../services/geminiResumeService");

// ─── Gemini Error Helper ──────────────────────────────────────────────────────

function handleGeminiError(error, res) {
  console.error("[ResumeReviewController] Error:", error?.message);

  const msg = (error?.message || "").toLowerCase();
  const status = error?.status ?? error?.httpStatusCode ?? null;

  if (msg.includes("missing or invalid")) {
    return res.status(500).json({ error: "Gemini API key is not configured. Check your .env file." });
  }
  if (msg.includes("api_key_invalid") || msg.includes("api key not valid")) {
    return res.status(401).json({ error: "Invalid Gemini API key. Check GEMINI_API_KEY in .env." });
  }
  if (status === 429 || msg.includes("quota") || msg.includes("rate limit")) {
    return res.status(429).json({ error: "Gemini rate limit reached. Please wait a moment and try again." });
  }
  if (msg.includes("too short")) {
    return res.status(400).json({ error: error.message });
  }
  if (msg.includes("could not extract") || msg.includes("unsupported file")) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: error?.message || "Resume analysis failed. Please try again." });
}

// ─── Analyze Resume (Unsaved) ────────────────────────────────────────────────

exports.analyzeResume = async (req, res) => {
  try {
    let buffer = null;
    let mimetype = null;
    let title = "Pasted Resume Text";

    if (req.file) {
      buffer = req.file.buffer;
      mimetype = req.file.mimetype;
      title = req.file.originalname || "Uploaded Resume";
    }

    const rawText = req.body.resumeText || req.body.text || "";

    if (!buffer && (!rawText || !rawText.trim())) {
      return res.status(400).json({ error: "Please upload a PDF/DOCX file or paste resume text." });
    }

    if (req.body.title && req.body.title.trim()) {
      title = req.body.title.trim();
    }

    const analysis = await analyzeResumeWithGemini({ buffer, mimetype, rawText });

    return res.status(200).json({
      title,
      analysis,
    });
  } catch (error) {
    return handleGeminiError(error, res);
  }
};

// ─── Save Resume Review ───────────────────────────────────────────────────────

exports.saveResumeReview = async (req, res) => {
  try {
    const { title, analysis } = req.body;

    if (!analysis || typeof analysis !== "object") {
      return res.status(400).json({ error: "Analysis data is required to save." });
    }

    const review = await ResumeReview.create({
      userId: req.user.id,
      title: (title || "Resume Analysis").trim(),
      score: analysis.score ?? 70,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      missingTechnicalSkills: analysis.missingTechnicalSkills || [],
      missingSoftSkills: analysis.missingSoftSkills || [],
      atsSuggestions: analysis.atsSuggestions || [],
      recommendedProjects: analysis.recommendedProjects || [],
      resumeTips: analysis.resumeTips || [],
      suggestedRoles: analysis.suggestedRoles || [],
    });

    console.log(`[ResumeReviewController] Analysis saved for user ${req.user.id}`);
    return res.status(201).json({ message: "Resume analysis saved successfully!", review });
  } catch (error) {
    console.error("[ResumeReviewController] Save error:", error?.message);
    return res.status(500).json({ error: "Failed to save resume analysis." });
  }
};

// ─── Get All Saved Reviews for Current User ───────────────────────────────────

exports.getUserResumeReviews = async (req, res) => {
  try {
    const reviews = await ResumeReview.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("title score createdAt _id");

    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("[ResumeReviewController] List error:", error?.message);
    return res.status(500).json({ error: "Failed to fetch saved reviews." });
  }
};

// ─── Get Single Saved Review ──────────────────────────────────────────────────

exports.getResumeReviewById = async (req, res) => {
  try {
    const review = await ResumeReview.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!review) {
      return res.status(404).json({ error: "Resume review not found." });
    }

    return res.status(200).json({ review });
  } catch (error) {
    console.error("[ResumeReviewController] GetById error:", error?.message);
    return res.status(500).json({ error: "Failed to fetch review." });
  }
};

// ─── Delete Saved Review ──────────────────────────────────────────────────────

exports.deleteResumeReview = async (req, res) => {
  try {
    const deleted = await ResumeReview.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Resume review not found or already deleted." });
    }

    console.log(`[ResumeReviewController] Deleted review ${req.params.id} for user ${req.user.id}`);
    return res.status(200).json({ message: "Resume review deleted successfully." });
  } catch (error) {
    console.error("[ResumeReviewController] Delete error:", error?.message);
    return res.status(500).json({ error: "Failed to delete review." });
  }
};
