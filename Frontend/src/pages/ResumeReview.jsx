import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./ResumeReview.css";

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const IconChevron = ({ open }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Score Meter Color Helper ────────────────────────────────────────────────

function getScoreTheme(score) {
  if (score >= 80) return { color: "#10b981", label: "Excellent", bg: "rgba(16, 185, 129, 0.15)" };
  if (score >= 60) return { color: "#f59e0b", label: "Good", bg: "rgba(245, 158, 11, 0.15)" };
  return { color: "#ef4444", label: "Needs Work", bg: "rgba(239, 68, 68, 0.15)" };
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <div className="rr-skeleton-container" aria-label="Analyzing resume…">
      <div className="rr-skeleton-pulse" style={{ height: "130px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rr-skeleton-pulse" style={{ height: "200px" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function ResumeReview() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Input states
  const [activeTab, setActiveTab] = useState("file"); // 'file' | 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Save states
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Library / saved analyses states
  const [savedReviews, setSavedReviews] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listOpen, setListOpen] = useState(false);

  // View saved state
  const [viewingReview, setViewingReview] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Fetch Saved Reviews ────────────────────────────────────────────────────
  const fetchSavedReviews = useCallback(async () => {
    try {
      const res = await API.get("/resume-review");
      setSavedReviews(res.data.reviews || []);
    } catch {
      // Non-critical
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedReviews();
  }, [fetchSavedReviews]);

  // ── File Selection ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg("");
    }
  };

  // ── Analyze Resume ────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setErrorMsg("");
    setAnalyzing(true);
    setAnalysisResult(null);
    setViewingReview(null);
    setSaved(false);

    try {
      let res;
      if (activeTab === "file") {
        if (!selectedFile) {
          setErrorMsg("Please select a PDF or DOCX resume file.");
          setAnalyzing(false);
          return;
        }

        const formData = new FormData();
        formData.append("resumeFile", selectedFile);
        if (customTitle.trim()) {
          formData.append("title", customTitle.trim());
        }

        res = await API.post("/resume-review/analyze", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        if (!resumeText.trim()) {
          setErrorMsg("Please paste your resume text in the area provided.");
          setAnalyzing(false);
          return;
        }

        res = await API.post("/resume-review/analyze", {
          resumeText: resumeText.trim(),
          title: customTitle.trim() || "Pasted Resume",
        });
      }

      setAnalysisResult(res.data.analysis);
      setActiveTitle(res.data.title || "Resume Review");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to analyze resume. Please check your file/text and try again.";
      setErrorMsg(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Save Resume Analysis ──────────────────────────────────────────────────
  const handleSave = async () => {
    const analysisToSave = viewingReview || analysisResult;
    if (!analysisToSave || saving || saved) return;

    setSaving(true);
    try {
      await API.post("/resume-review/save", {
        title: activeTitle || "Resume Review",
        analysis: analysisToSave,
      });
      setSaved(true);
      showToast("Analysis saved to library! 🎉");
      fetchSavedReviews();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save analysis.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Saved Analysis ─────────────────────────────────────────────────
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/resume-review/${id}`);
      setSavedReviews((prev) => prev.filter((r) => r._id !== id));
      if (viewingReview?._id === id) {
        setViewingReview(null);
        setAnalysisResult(null);
      }
      showToast("Analysis deleted.");
    } catch {
      showToast("Failed to delete review.", "error");
    }
  };

  // ── View Saved Analysis ───────────────────────────────────────────────────
  const handleViewSaved = async (id) => {
    if (viewingReview?._id === id) {
      setViewingReview(null);
      return;
    }
    setLoadingView(true);
    setAnalysisResult(null);
    setErrorMsg("");
    setSaved(true);
    try {
      const res = await API.get(`/resume-review/${id}`);
      const rev = res.data.review;
      setViewingReview(rev);
      setActiveTitle(rev.title);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      showToast("Failed to load review details.", "error");
    } finally {
      setLoadingView(false);
    }
  };

  // Active display data (newly generated or viewed saved)
  const activeAnalysis = viewingReview || analysisResult;
  const theme = activeAnalysis ? getScoreTheme(activeAnalysis.score) : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="rr-container">
      {/* Toast Notification */}
      {toast && <div className="rr-toast">{toast.message}</div>}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="rr-header">
        <button
          className="rr-back-btn"
          onClick={() => navigate("/dashboard")}
          aria-label="Back to Dashboard"
        >
          ← Back
        </button>
        <div className="rr-header-title">
          <span className="rr-header-icon">📄</span>
          <div>
            <h1>AI Resume Review</h1>
            <p>Upload your resume to get instant AI scoring, ATS suggestions & skill gap analysis</p>
          </div>
        </div>
      </header>

      {/* ── Input Section ───────────────────────────────────────────────── */}
      <section className="rr-input-card" aria-label="Resume input">
        <div className="rr-input-tabs">
          <button
            className={`rr-tab-btn ${activeTab === "file" ? "active" : ""}`}
            onClick={() => setActiveTab("file")}
          >
            📁 Upload PDF / DOCX
          </button>
          <button
            className={`rr-tab-btn ${activeTab === "text" ? "active" : ""}`}
            onClick={() => setActiveTab("text")}
          >
            📝 Paste Resume Text
          </button>
        </div>

        {activeTab === "file" ? (
          <div>
            <div
              className="rr-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="rr-dropzone-icon">☁️</div>
              <p>Click to select or drag and drop your resume file</p>
              <span>Supports PDF (.pdf) and Word (.docx) up to 10MB</span>
              <input
                type="file"
                ref={fileInputRef}
                className="rr-file-input"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
            </div>

            {selectedFile && (
              <div className="rr-file-selected">
                <div className="rr-file-info">
                  <IconFile />
                  <div>
                    <span className="rr-file-name">{selectedFile.name}</span>
                    <span className="rr-file-size">
                      {" "}
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
                <button
                  className="rr-remove-file"
                  onClick={() => setSelectedFile(null)}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              className="rr-textarea"
              placeholder="Paste your full resume text here (Work experience, Skills, Education, Projects)..."
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                setErrorMsg("");
              }}
            />
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.4rem" }}>
              {resumeText.length} characters
            </p>
          </div>
        )}

        <div className="rr-input-footer">
          <input
            type="text"
            placeholder="Optional Title (e.g. Senior MERN Resume v2)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "0.6rem 1rem",
              color: "#fff",
              fontSize: "0.9rem",
              flex: "1",
              minWidth: "220px",
            }}
          />

          <button
            className="rr-analyze-btn"
            onClick={handleAnalyze}
            disabled={analyzing || (activeTab === "file" && !selectedFile) || (activeTab === "text" && !resumeText.trim())}
          >
            {analyzing ? "Analyzing Resume…" : "✨ Analyze Resume"}
          </button>
        </div>

        {errorMsg && <div className="rr-error-banner">⚠️ {errorMsg}</div>}
      </section>

      {/* ── Loading State ───────────────────────────────────────────────── */}
      {analyzing && <SkeletonLoader />}

      {/* ── Results Dashboard ───────────────────────────────────────────── */}
      {activeAnalysis && !analyzing && (
        <section aria-label="Resume Review Results">
          {/* Score Header Card */}
          <div className="rr-score-card">
            <div className="rr-score-ring-wrapper">
              <div
                className="rr-score-circle"
                style={{
                  background: `conic-gradient(${theme.color} ${activeAnalysis.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                }}
              >
                <div className="rr-score-inner">
                  <span className="rr-score-number" style={{ color: theme.color }}>
                    {activeAnalysis.score}
                  </span>
                  <span className="rr-score-max">/100</span>
                </div>
              </div>

              <div className="rr-score-meta">
                <h2>{activeTitle}</h2>
                <span
                  className="rr-score-label"
                  style={{ background: theme.bg, color: theme.color }}
                >
                  {theme.label} Rating
                </span>
              </div>
            </div>

            {!viewingReview && (
              <button
                className={`rr-save-btn ${saved ? "saved" : ""}`}
                onClick={handleSave}
                disabled={saving || saved}
              >
                {saving ? (
                  "Saving…"
                ) : saved ? (
                  "✅ Saved to Library"
                ) : (
                  <>
                    <IconSave /> Save Analysis
                  </>
                )}
              </button>
            )}
          </div>

          {/* Cards Grid */}
          <div className="rr-grid">
            {/* Strengths */}
            {activeAnalysis.strengths?.length > 0 && (
              <div className="rr-card">
                <div className="rr-card-header">
                  <span className="rr-card-icon">🚀</span>
                  <h3 className="rr-card-title">Key Strengths</h3>
                </div>
                <ul className="rr-list strengths">
                  {activeAnalysis.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {activeAnalysis.weaknesses?.length > 0 && (
              <div className="rr-card">
                <div className="rr-card-header">
                  <span className="rr-card-icon">⚠️</span>
                  <h3 className="rr-card-title">Areas for Improvement</h3>
                </div>
                <ul className="rr-list weaknesses">
                  {activeAnalysis.weaknesses.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Technical Skills */}
            {activeAnalysis.missingTechnicalSkills?.length > 0 && (
              <div className="rr-card">
                <div className="rr-card-header">
                  <span className="rr-card-icon">💻</span>
                  <h3 className="rr-card-title">Missing Technical Skills</h3>
                </div>
                <div className="rr-pills">
                  {activeAnalysis.missingTechnicalSkills.map((skill, i) => (
                    <span key={i} className="rr-pill tech">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Soft Skills */}
            {activeAnalysis.missingSoftSkills?.length > 0 && (
              <div className="rr-card">
                <div className="rr-card-header">
                  <span className="rr-card-icon">🗣️</span>
                  <h3 className="rr-card-title">Missing Soft Skills</h3>
                </div>
                <div className="rr-pills">
                  {activeAnalysis.missingSoftSkills.map((skill, i) => (
                    <span key={i} className="rr-pill soft">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ATS Optimization Suggestions */}
            {activeAnalysis.atsSuggestions?.length > 0 && (
              <div className="rr-card">
                <div className="rr-card-header">
                  <span className="rr-card-icon">⚡</span>
                  <h3 className="rr-card-title">ATS Optimization</h3>
                </div>
                <ul className="rr-list ats">
                  {activeAnalysis.atsSuggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resume Tips */}
            {activeAnalysis.resumeTips?.length > 0 && (
              <div className="rr-card">
                <div className="rr-card-header">
                  <span className="rr-card-icon">💡</span>
                  <h3 className="rr-card-title">General Resume Tips</h3>
                </div>
                <ul className="rr-list tips">
                  {activeAnalysis.resumeTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Job Roles */}
            {activeAnalysis.suggestedRoles?.length > 0 && (
              <div className="rr-card">
                <div className="rr-card-header">
                  <span className="rr-card-icon">🎯</span>
                  <h3 className="rr-card-title">Suggested Job Roles</h3>
                </div>
                <div className="rr-pills">
                  {activeAnalysis.suggestedRoles.map((role, i) => (
                    <span key={i} className="rr-pill role">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Projects */}
            {activeAnalysis.recommendedProjects?.length > 0 && (
              <div className="rr-card" style={{ gridColumn: "1 / -1" }}>
                <div className="rr-card-header">
                  <span className="rr-card-icon">🛠️</span>
                  <h3 className="rr-card-title">Recommended Projects to Boost Resume</h3>
                </div>
                <div className="rr-projects-list">
                  {activeAnalysis.recommendedProjects.map((proj, i) => (
                    <div key={i} className="rr-project-item">
                      <h4>{proj.title}</h4>
                      <p>{proj.description}</p>
                      <div className="rr-pills">
                        {(proj.techStack || []).map((t, j) => (
                          <span key={j} className="rr-pill tech">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Saved Reviews Accordion ─────────────────────────────────────── */}
      <section className="rr-saved-section" aria-label="Saved resume analyses">
        <button
          className="rr-saved-toggle"
          onClick={() => setListOpen((prev) => !prev)}
        >
          <span>📁 My Saved Resume Reviews ({savedReviews.length})</span>
          <IconChevron open={listOpen} />
        </button>

        {listOpen && (
          <div className="rr-saved-list">
            {loadingList ? (
              <p style={{ color: "#94a3b8", textAlign: "center" }}>Loading saved reviews…</p>
            ) : savedReviews.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center" }}>
                No saved analyses yet. Analyze your resume above and click Save! 🚀
              </p>
            ) : (
              savedReviews.map((r) => {
                const st = getScoreTheme(r.score);
                return (
                  <div
                    key={r._id}
                    className="rr-saved-item"
                    onClick={() => handleViewSaved(r._id)}
                  >
                    <div>
                      <div className="rr-saved-item-title">{r.title}</div>
                      <div className="rr-saved-item-meta">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span
                        className="rr-saved-badge"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {r.score}/100
                      </span>
                      <button
                        className="rr-delete-btn"
                        onClick={(e) => handleDelete(r._id, e)}
                        title="Delete Review"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default ResumeReview;
