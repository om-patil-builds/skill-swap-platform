import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./LearningRoadmap.css";

// ─── Icon Components ─────────────────────────────────────────────────────────

const IconTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);
const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <div className="skeleton-wrapper" aria-label="Generating your roadmap…">
      <div className="skeleton-header">
        <div className="skeleton-bar wide" />
        <div className="skeleton-bar short" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`skeleton-card ${i % 2 === 0 ? "right" : "left"}`}>
          <div className="skeleton-dot" />
          <div className="skeleton-content">
            <div className="skeleton-bar medium" />
            <div className="skeleton-bar wide" />
            <div className="skeleton-bar short" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Resource Type Badge ─────────────────────────────────────────────────────

const RESOURCE_COLORS = {
  video: "#ff6b6b",
  article: "#4ecdc4",
  docs: "#45b7d1",
  course: "#96ceb4",
  book: "#dda0dd",
  other: "#a8a8b3",
};

function ResourceBadge({ type }) {
  return (
    <span className="resource-badge" style={{ background: RESOURCE_COLORS[type] || RESOURCE_COLORS.other }}>
      {type}
    </span>
  );
}

// ─── Week Card ───────────────────────────────────────────────────────────────

function WeekCard({ week, index }) {
  const isRight = index % 2 === 1;
  return (
    <div className={`week-card ${isRight ? "week-right" : "week-left"}`}>
      <div className="week-dot">
        <span>{week.week}</span>
      </div>
      <div className="week-card-inner">
        <div className="week-card-header">
          <h4 className="week-title">{week.title}</h4>
          <span className="week-hours">
            <IconClock /> {week.hours}h
          </span>
        </div>
        <ul className="week-topics">
          {(week.topics || []).map((topic, i) => (
            <li key={i}>{topic}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Toast Notification ──────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss">✕</button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function LearningRoadmap() {
  const navigate = useNavigate();

  // Generation state
  const [goal, setGoal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [currentGoal, setCurrentGoal] = useState("");
  const [genError, setGenError] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Saved roadmaps list
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listOpen, setListOpen] = useState(false);

  // View saved roadmap
  const [viewingRoadmap, setViewingRoadmap] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  // ── Fetch saved roadmaps list ─────────────────────────────────────────────
  const fetchSavedRoadmaps = useCallback(async () => {
    try {
      const res = await API.get("/roadmap");
      setSavedRoadmaps(res.data.roadmaps || []);
    } catch {
      // Non-critical — fail silently
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedRoadmaps();
  }, [fetchSavedRoadmaps]);

  // ── Generate roadmap ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const trimmed = goal.trim();
    if (!trimmed) return;
    if (trimmed.length > 300) {
      setGenError("Goal is too long (max 300 characters).");
      return;
    }

    setGenerating(true);
    setRoadmap(null);
    setGenError("");
    setSaved(false);
    setViewingRoadmap(null);

    try {
      const res = await API.post("/roadmap/generate", { goal: trimmed });
      setRoadmap(res.data.roadmap);
      setCurrentGoal(res.data.goal);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to generate roadmap. Please try again.";
      setGenError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !generating) handleGenerate();
  };

  // ── Save roadmap ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!roadmap || saving || saved) return;
    setSaving(true);
    try {
      await API.post("/roadmap/save", { goal: currentGoal, roadmap });
      setSaved(true);
      showToast("Roadmap saved successfully! 🎉");
      fetchSavedRoadmaps();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save roadmap.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete saved roadmap ──────────────────────────────────────────────────
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/roadmap/${id}`);
      setSavedRoadmaps((prev) => prev.filter((r) => r._id !== id));
      if (viewingRoadmap?._id === id) setViewingRoadmap(null);
      showToast("Roadmap deleted.");
    } catch {
      showToast("Failed to delete roadmap.", "error");
    }
  };

  // ── View a saved roadmap ──────────────────────────────────────────────────
  const handleView = async (id) => {
    if (viewingRoadmap?._id === id) {
      setViewingRoadmap(null);
      return;
    }
    setLoadingView(true);
    setRoadmap(null);
    setGenError("");
    setSaved(true);
    try {
      const res = await API.get(`/roadmap/${id}`);
      setViewingRoadmap(res.data.roadmap);
      setCurrentGoal(res.data.roadmap.goal);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      showToast("Failed to load roadmap.", "error");
    } finally {
      setLoadingView(false);
    }
  };

  // ── Active roadmap display (either newly generated or viewed from DB) ─────
  const activeRoadmap = viewingRoadmap || roadmap;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="rl-container">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="rl-header">
        <button
          id="rl-back-btn"
          className="rl-back-btn"
          onClick={() => navigate("/dashboard")}
          aria-label="Back to Dashboard"
        >
          ← Back
        </button>
        <div className="rl-header-title">
          <span className="rl-header-icon">🗺️</span>
          <div>
            <h1>AI Learning Roadmap</h1>
            <p>Enter your goal and get a personalized study plan powered by Gemini AI</p>
          </div>
        </div>
      </header>

      {/* ── Goal Input Section ───────────────────────────────────────────── */}
      <section className="rl-input-section" aria-label="Goal input">
        <div className="rl-input-card">
          <label htmlFor="rl-goal-input" className="rl-input-label">
            <IconTarget /> What do you want to learn?
          </label>
          <div className="rl-input-row">
            <input
              id="rl-goal-input"
              type="text"
              className="rl-goal-input"
              value={goal}
              onChange={(e) => { setGoal(e.target.value); setGenError(""); }}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Become a MERN Stack Developer", "Master Machine Learning"'
              maxLength={300}
              disabled={generating}
              aria-label="Learning goal"
            />
            <button
              id="rl-generate-btn"
              className={`rl-generate-btn ${generating ? "generating" : ""}`}
              onClick={handleGenerate}
              disabled={!goal.trim() || generating}
              aria-label="Generate Roadmap"
            >
              {generating ? (
                <>
                  <span className="rl-spinner" />
                  Generating…
                </>
              ) : (
                "✨ Generate Roadmap"
              )}
            </button>
          </div>
          {genError && (
            <div className="rl-error-banner" role="alert">
              ⚠️ {genError}
            </div>
          )}
          <p className="rl-input-hint">
            {goal.length}/300 chars · Press Enter to generate
          </p>
        </div>
      </section>

      {/* ── Loading Skeleton ─────────────────────────────────────────────── */}
      {generating && <SkeletonLoader />}

      {/* ── Roadmap Display ──────────────────────────────────────────────── */}
      {activeRoadmap && !generating && (
        <section className="rl-roadmap-section" aria-label="Generated roadmap">

          {/* ── Objective Card ─────────────────────────────────────────── */}
          <div className="rl-objective-card">
            <div className="rl-objective-top">
              <div>
                <p className="rl-objective-label">Learning Goal</p>
                <h2 className="rl-goal-title">{currentGoal}</h2>
                <p className="rl-objective-text">{activeRoadmap.objective}</p>
              </div>
              <div className="rl-duration-badge">
                <IconClock />
                <span>{activeRoadmap.duration}</span>
              </div>
            </div>

            {/* Save Button */}
            {!viewingRoadmap && (
              <div className="rl-save-row">
                <button
                  id="rl-save-btn"
                  className={`rl-save-btn ${saved ? "saved" : ""}`}
                  onClick={handleSave}
                  disabled={saving || saved}
                  aria-label={saved ? "Roadmap saved" : "Save roadmap"}
                >
                  {saving ? (
                    <><span className="rl-spinner small" /> Saving…</>
                  ) : saved ? (
                    <>✅ Saved to Library</>
                  ) : (
                    <><IconSave /> Save Roadmap</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Weekly Timeline ─────────────────────────────────────────── */}
          {activeRoadmap.weeklyPlan?.length > 0 && (
            <div className="rl-section">
              <h3 className="rl-section-title">
                <span className="rl-section-icon">📅</span> Week-by-Week Study Plan
              </h3>
              <div className="rl-timeline">
                <div className="rl-timeline-line" />
                {activeRoadmap.weeklyPlan.map((week, i) => (
                  <WeekCard key={i} week={week} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── Mini Projects ───────────────────────────────────────────── */}
          {activeRoadmap.miniProjects?.length > 0 && (
            <div className="rl-section">
              <h3 className="rl-section-title">
                <span className="rl-section-icon">🔨</span> Mini Projects
              </h3>
              <div className="rl-projects-grid">
                {activeRoadmap.miniProjects.map((proj, i) => (
                  <div key={i} className="rl-project-card">
                    <h4>{proj.title}</h4>
                    <p>{proj.description}</p>
                    <div className="rl-tech-tags">
                      {(proj.tech || []).map((t, j) => (
                        <span key={j} className="rl-tech-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Final Project ───────────────────────────────────────────── */}
          {activeRoadmap.finalProject?.title && (
            <div className="rl-section">
              <h3 className="rl-section-title">
                <span className="rl-section-icon">🏆</span> Capstone Project
              </h3>
              <div className="rl-final-project-card">
                <div className="rl-final-glow" />
                <h4>{activeRoadmap.finalProject.title}</h4>
                <p>{activeRoadmap.finalProject.description}</p>
                {activeRoadmap.finalProject.features?.length > 0 && (
                  <ul className="rl-final-features">
                    {activeRoadmap.finalProject.features.map((f, i) => (
                      <li key={i}>
                        <span className="rl-feature-dot" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ── Interview Tips ──────────────────────────────────────────── */}
          {activeRoadmap.interviewTips?.length > 0 && (
            <div className="rl-section">
              <h3 className="rl-section-title">
                <span className="rl-section-icon">💼</span> Interview Preparation Tips
              </h3>
              <div className="rl-tips-grid">
                {activeRoadmap.interviewTips.map((tip, i) => (
                  <div key={i} className="rl-tip-card">
                    <span className="rl-tip-number">{String(i + 1).padStart(2, "0")}</span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Resources ───────────────────────────────────────────────── */}
          {activeRoadmap.resources?.length > 0 && (
            <div className="rl-section">
              <h3 className="rl-section-title">
                <span className="rl-section-icon">📚</span> Recommended Resources
              </h3>
              <div className="rl-resources-list">
                {activeRoadmap.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rl-resource-item"
                    aria-label={`${res.title} - ${res.type}`}
                  >
                    <ResourceBadge type={res.type} />
                    <span className="rl-resource-title">{res.title}</span>
                    <span className="rl-resource-link">
                      <IconLink />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Saved Roadmaps Accordion ─────────────────────────────────────── */}
      <section className="rl-saved-section" aria-label="Saved roadmaps">
        <button
          id="rl-saved-toggle"
          className="rl-saved-toggle"
          onClick={() => setListOpen((o) => !o)}
          aria-expanded={listOpen}
        >
          <span>📁 My Saved Roadmaps</span>
          <div className="rl-saved-toggle-right">
            {savedRoadmaps.length > 0 && (
              <span className="rl-saved-count">{savedRoadmaps.length}</span>
            )}
            <IconChevron open={listOpen} />
          </div>
        </button>

        {listOpen && (
          <div className="rl-saved-list">
            {loadingList ? (
              <p className="rl-saved-empty">Loading your roadmaps…</p>
            ) : savedRoadmaps.length === 0 ? (
              <p className="rl-saved-empty">No saved roadmaps yet. Generate one above! 🚀</p>
            ) : (
              savedRoadmaps.map((r) => (
                <div
                  key={r._id}
                  className={`rl-saved-item ${viewingRoadmap?._id === r._id ? "active" : ""}`}
                  onClick={() => handleView(r._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleView(r._id)}
                  aria-label={`View roadmap: ${r.goal}`}
                >
                  <div className="rl-saved-item-info">
                    <span className="rl-saved-item-goal">{r.goal}</span>
                    <span className="rl-saved-item-meta">
                      {r.duration} · {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  <button
                    id={`rl-delete-${r._id}`}
                    className="rl-delete-btn"
                    onClick={(e) => handleDelete(r._id, e)}
                    aria-label={`Delete roadmap: ${r.goal}`}
                    title="Delete"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Loading indicator for viewing saved roadmap */}
      {loadingView && (
        <div className="rl-loading-view" role="status" aria-label="Loading saved roadmap">
          <span className="rl-spinner large" />
          <p>Loading roadmap…</p>
        </div>
      )}
    </div>
  );
}

export default LearningRoadmap;
