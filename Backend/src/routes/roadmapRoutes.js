const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  generateRoadmap,
  saveRoadmap,
  getUserRoadmaps,
  getRoadmapById,
  deleteRoadmap,
} = require("../controllers/roadmapController");

// All routes are protected — require valid JWT
router.use(authMiddleware);

// POST /api/roadmap/generate — call Gemini and return roadmap (not saved)
router.post("/generate", generateRoadmap);

// POST /api/roadmap/save — save a generated roadmap to MongoDB
router.post("/save", saveRoadmap);

// GET /api/roadmap — list all saved roadmaps for the current user
router.get("/", getUserRoadmaps);

// GET /api/roadmap/:id — get a single full roadmap
router.get("/:id", getRoadmapById);

// DELETE /api/roadmap/:id — delete a saved roadmap
router.delete("/:id", deleteRoadmap);

module.exports = router;
