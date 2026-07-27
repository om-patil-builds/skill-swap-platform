const Session = require("../models/session.model");
const Request = require("../models/request.model");
const mongoose = require("mongoose");

function normalizeTimeTo24h(time12h) {
  if (!time12h) return null;
  const cleaned = String(time12h).trim().toLowerCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3];

  if (period === "pm" && hours < 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || parseInt(minutes, 10) > 59) return null;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function isSessionInPast(dateStr, time24h) {
  if (!dateStr || !time24h) return false;
  const now = new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = time24h.split(":").map(Number);
  const sessionDate = new Date(year, month - 1, day, hours, minutes, 0);
  return sessionDate <= now;
}

async function createSession(req, res) {
  try {
    const { learner, topic, date, time, meetLink } = req.body;
    const teacherId = req.user.id;

    if (!learner || !topic || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Learner, topic, date, and time are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(learner)) {
      return res.status(400).json({
        success: false,
        message: "Invalid learner ID",
      });
    }

    if (String(teacherId) === String(learner)) {
      return res.status(400).json({
        success: false,
        message: "You cannot schedule a session with yourself",
      });
    }

    const connection = await Request.findOne({
      $or: [
        { sender: teacherId, receiver: learner, status: "accepted" },
        { sender: learner, receiver: teacherId, status: "accepted" },
      ],
    });

    if (!connection) {
      return res.status(403).json({
        success: false,
        message: "You can only schedule sessions with accepted connections",
      });
    }

    const time24h = normalizeTimeTo24h(time);
    if (!time24h) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM AM/PM",
      });
    }

    if (isSessionInPast(date, time24h)) {
      return res.status(400).json({
        success: false,
        message: "Cannot schedule a session in the past",
      });
    }

    const existing = await Session.findOne({
      teacher: teacherId,
      learner,
      topic: topic.trim(),
      date,
      time: time24h,
      status: { $nin: ["cancelled"] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A session with this topic, learner, date, and time already exists",
      });
    }

    const session = await Session.create({
      teacher: teacherId,
      learner,
      topic: topic.trim(),
      date,
      time: time24h,
      meetLink: meetLink ? meetLink.trim() : "",
    });

    const populated = await Session.findById(session._id)
      .populate("teacher", "username")
      .populate("learner", "username")
      .lean();

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      session: populated,
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
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({
      $or: [
        { teacher: userId },
        { learner: userId },
      ],
    })
      .populate("teacher", "username")
      .populate("learner", "username")
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments({
      $or: [
        { teacher: userId },
        { learner: userId },
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

async function getSessionById(req, res) {
  try {
    const session = await Session.findById(req.params.id)
      .populate("teacher", "username")
      .populate("learner", "username");

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
    console.error("Get session by id error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function updateSession(req, res) {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const userId = req.user.id;
    if (String(session.teacher) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the teacher can edit this session",
      });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a cancelled session",
      });
    }

    const { topic, date, time, meetLink } = req.body;

    if (topic !== undefined) session.topic = topic.trim();
    if (meetLink !== undefined) session.meetLink = meetLink ? meetLink.trim() : "";

    if (date !== undefined || time !== undefined) {
      const newDate = date !== undefined ? date : session.date;
      const newTime = time !== undefined ? time : session.time;

      if (newDate && newTime) {
        const time24h = normalizeTimeTo24h(newTime);
        if (!time24h) {
          return res.status(400).json({
            success: false,
            message: "Invalid time format. Use HH:MM AM/PM",
          });
        }

        if (isSessionInPast(newDate, time24h)) {
          return res.status(400).json({
            success: false,
            message: "Cannot schedule a session in the past",
          });
        }

        session.date = newDate;
        session.time = time24h;
      }
    }

    await session.save();

    const populated = await Session.findById(session._id)
      .populate("teacher", "username")
      .populate("learner", "username")
      .lean();

    res.status(200).json({
      success: true,
      message: "Session updated successfully",
      session: populated,
    });
  } catch (err) {
    console.error("Update session error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function updateSessionStatus(req, res) {
  try {
    const { status } = req.body;
    const userId = req.user.id;

    if (!["accepted", "rejected", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (status === "cancelled") {
      if (
        String(session.teacher) !== String(userId) &&
        String(session.learner) !== String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message: "Not allowed to cancel this session",
        });
      }

      session.status = "cancelled";
      session.cancelledBy = userId;
      await session.save();

      return res.status(200).json({
        success: true,
        message: "Session cancelled successfully",
        session,
      });
    }

    if (String(session.learner) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the learner can accept or reject this session",
      });
    }

    session.status = status;
    await session.save();

    res.status(200).json({
      success: true,
      message: `Session ${status}`,
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
      status: { $nin: ["cancelled"] },
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
  getSessionById,
  updateSession,
  updateSessionStatus,
  getChatSessions,
};