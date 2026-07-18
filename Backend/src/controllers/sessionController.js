const Session = require("../models/session.model");

createSession = async (req, res) => {
  try {
    const { learner, topic, date, time, meetLink } = req.body;

    const session = await Session.create({
      teacher: req.user.id, // from JWT
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
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { teacher: req.user.id },
        { learner: req.user.id },
      ],
    })
      .populate("teacher", "username")
      .populate("learner", "username");

    res.status(200).json({
      success: true,
      sessions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

updateSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      session,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



const getChatSessions = async (req, res) => {
  const sessions = await Session.find({
    $or: [
      { teacher: req.user.id, learner: req.params.userId },
      { teacher: req.params.userId, learner: req.user.id },
    ],
  })
    .populate("teacher", "username")
    .populate("learner", "username");

  res.json({
    success: true,
    sessions,
  });
};


module.exports = {
  createSession,
  getMySessions,
  updateSessionStatus,
  getChatSessions,
};