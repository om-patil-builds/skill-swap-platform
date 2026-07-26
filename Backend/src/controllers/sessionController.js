const Session = require("../models/session.model");

async function createSession(req, res) {
  try {
    const { learner, topic, date, time, meetLink } = req.body;

    if (!learner || !topic || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Learner, topic, date, and time are required",
      });
    }

    const session = await Session.create({
      teacher: req.user.id,
      learner,
      topic,
      date,
      time,
      meetLink,
    });

    res.status(201).json({
      success: true,
      session,
    });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function getMySessions(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({
      $or: [
        { teacher: req.user.id },
        { learner: req.user.id },
      ],
    })
      .populate("teacher", "username")
      .populate("learner", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments({
      $or: [
        { teacher: req.user.id },
        { learner: req.user.id },
      ],
    });

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("Get my sessions error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function updateSessionStatus(req, res) {
  try {
    const { status } = req.body;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (err) {
    console.error("Update session status error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function getChatSessions(req, res) {
  try {
    const sessions = await Session.find({
      $or: [
        { teacher: req.user.id, learner: req.params.userId },
        { teacher: req.params.userId, learner: req.user.id },
      ],
    })
      .populate("teacher", "username")
      .populate("learner", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      sessions,
    });
  } catch (err) {
    console.error("Get chat sessions error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

module.exports = {
  createSession,
  getMySessions,
  updateSessionStatus,
  getChatSessions,
};
