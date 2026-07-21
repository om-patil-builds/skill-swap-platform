const { GoogleGenerativeAI } = require("@google/generative-ai");

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are SkillBot, an expert AI programming mentor on SkillSwap.

Your role:
- Answer programming, computer science, and software engineering questions clearly.
- Explain concepts simply with real-world examples and code snippets.
- Help with interview prep: DSA, system design, behavioral questions, resume tips.
- Suggest best practices and next learning steps.

Rules:
- ONLY answer programming, tech, or career-related questions.
- If a question is off-topic, say: "I'm specialized in programming and tech topics only!"
- Use markdown for code blocks and lists where helpful.`;

// ─── Controller ──────────────────────────────────────────────────────────────

exports.getMentorResponse = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // ── Validate input ───────────────────────────────────────────────────────
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (message.trim().length > 4000) {
      return res.status(400).json({ error: "Message too long (max 4000 chars)." });
    }

    // ── Validate API key ─────────────────────────────────────────────────────
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const isPlaceholder =
      !apiKey ||
      apiKey === "your_gemini_api_key_here" ||
      apiKey.length < 10;

    if (isPlaceholder) {
      console.error("[SkillBot] GEMINI_API_KEY is missing or is still the placeholder value.");
      return res.status(500).json({
        error:
          "AI Mentor is not configured. Please add a valid GEMINI_API_KEY to your .env file and restart the server.",
      });
    }

    console.log("[SkillBot] API key found, key starts with:", apiKey.substring(0, 8) + "...");

    // ── Build sanitised history ──────────────────────────────────────────────
    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (t) =>
              t &&
              (t.role === "user" || t.role === "model") &&
              Array.isArray(t.parts) &&
              t.parts[0]?.text
          )
          .slice(-18) // keep last 9 pairs
      : [];

    // ── Call Gemini ──────────────────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = (process.env.GEMINI_MODEL || "gemini-flash-latest").trim();
    const model = genAI.getGenerativeModel({ model: modelName });

    // Inject system prompt as first user/model exchange if no history
    let chatHistory = safeHistory;
    if (chatHistory.length === 0) {
      chatHistory = [
        {
          role: "user",
          parts: [{ text: `[System instruction - follow strictly]: ${SYSTEM_PROMPT}\n\nPlease confirm you understand your role.` }],
        },
        {
          role: "model",
          parts: [{ text: "Understood! I'm SkillBot, your AI programming mentor on SkillSwap. I'm ready to help with coding, DSA, system design, interview prep, and tech career questions. What would you like to learn today?" }],
        },
      ];
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    if (!reply || !reply.trim()) {
      return res.status(500).json({ error: "AI returned an empty response. Try again." });
    }

    console.log("[SkillBot] Successfully generated response.");
    return res.status(200).json({ reply: reply.trim() });

  } catch (error) {
    // ── Log the FULL error so we can debug ───────────────────────────────────
    console.error("[SkillBot] Full error object:", JSON.stringify(error, null, 2));
    console.error("[SkillBot] Error message:", error?.message);
    console.error("[SkillBot] Error status:", error?.status);

    const msg = (error?.message || "").toLowerCase();
    const status = error?.status ?? error?.httpStatusCode ?? null;

    if (msg.includes("api_key_invalid") || msg.includes("api key not valid")) {
      return res.status(401).json({
        error: "Invalid Gemini API key. Update GEMINI_API_KEY in .env and restart the server.",
      });
    }

    if (status === 429 || msg.includes("quota") || msg.includes("rate limit")) {
      return res.status(429).json({
        error: "Gemini rate limit hit. Please wait a moment and try again.",
      });
    }

    if (status === 403 || msg.includes("permission") || msg.includes("forbidden")) {
      return res.status(403).json({
        error: "API key doesn't have permission. Check your Gemini API key.",
      });
    }

    if (status === 404 || msg.includes("not found") || msg.includes("not supported")) {
      return res.status(503).json({
        error: `Gemini model "${process.env.GEMINI_MODEL || "gemini-flash-latest"}" is unavailable. Update GEMINI_MODEL in .env and restart the server.`,
      });
    }

    return res.status(500).json({
      error: "AI Mentor is temporarily unavailable. Please try again.",
    });
  }
};
