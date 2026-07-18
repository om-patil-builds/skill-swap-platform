const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  sendRequest,  
  updateRequest,
  getMyRequests,
  checkAccess,
  getConnectionStatus,
  getAcceptedConnections
  
} = require("../controllers/requestController");

// 🔥 Send request
router.post("/send", authMiddleware, sendRequest);

// 🔥 Accept / Reject request
router.put("/:requestId", authMiddleware, updateRequest);

// 🔥 Get my pending requests
router.get("/my", authMiddleware, getMyRequests);

// 🔥 Check if chat allowed (VERY IMPORTANT)
router.get("/check/:otherUserId", authMiddleware, checkAccess);

router.get("/status/:otherUserId", authMiddleware, getConnectionStatus);

router.get("/accepted", authMiddleware, getAcceptedConnections);

module.exports = router;