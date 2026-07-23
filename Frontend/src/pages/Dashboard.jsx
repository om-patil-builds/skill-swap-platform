import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const [userProfile, setUserProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [matches, setMatches] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [connectionsCount, setConnectionsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [meetingsCount, setMeetingsCount] = useState(0);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/profile");
      setUserProfile(res.data.user || null);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await API.get("/chat/list");
      setChats(res.data.chats || []);
    } catch (err) {
      console.error("Chats fetch error:", err);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await API.get("/users/matches");
      const data = res.data.matches || [];
      setMatches(data);
      return data;
    } catch (err) {
      console.error("Matches fetch error:", err);
      return [];
    }
  };

  const fetchStatus = async (users) => {
    if (!users || users.length === 0) return;
    try {
      const promises = users.map((user) => API.get(`/requests/status/${user._id}`));
      const responses = await Promise.all(promises);

      const map = {};
      users.forEach((user, index) => {
        map[user._id] = responses[index].data.status || "none";
      });

      setStatusMap(map);
    } catch (err) {
      console.error("Status fetch error:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Notifications error:", err);
    }
  };

  const fetchConnectionsCount = async () => {
    try {
      const res = await API.get("/requests/accepted");
      const count = res.data.count ?? res.data.users?.length ?? 0;
      setConnectionsCount(count);
    } catch (err) {
      console.error("Connections count error:", err);
    }
  };

  const fetchPendingRequestsCount = async () => {
    try {
      const res = await API.get("/requests/my");
      const count = res.data.count ?? res.data.requests?.length ?? 0;
      setPendingRequestsCount(count);
    } catch (err) {
      console.error("Pending requests count error:", err);
    }
  };

  const fetchMeetingsCount = async () => {
    try {
      const res = await API.get("/sessions/my");
      const count = res.data.sessions?.length ?? 0;
      setMeetingsCount(count);
    } catch (err) {
      console.error("Meetings count error:", err);
    }
  };

  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setShowNotifications(false);
      navigate("/requests");
    } catch (err) {
      console.error("Notification click error:", err);
    }
  };

  const handleMessagesClick = () => {
    if (chats && chats.length > 0) {
      const firstChat = chats.find((c) => c._id);
      if (firstChat) {
        navigate(`/chat/${firstChat._id}`);
        return;
      }
    }
    navigate("/connections");
  };

  const handleConnect = async (userId) => {
    setStatusMap((prev) => ({ ...prev, [userId]: "loading" }));

    try {
      await API.post("/requests/send", { receiverId: userId });
      setStatusMap((prev) => ({ ...prev, [userId]: "sent" }));
    } catch (err) {
      setStatusMap((prev) => ({ ...prev, [userId]: "none" }));
      const message = err.response?.data?.message;
      if (message === "Request already exists between users") {
        setStatusMap((prev) => ({ ...prev, [userId]: "sent" }));
        return;
      }
      console.error("Connect error:", message);
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/");
    }
  };

  const handleAiWorkspaceClick = () => {
    const el = document.getElementById("ai-workspace");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/ai-mentor");
    }
  };

  const filteredMatches = matches.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (u.username || u.name || "").toLowerCase();
    const skillsH = (u.skillsHave || u.skillsProficient || []).join(" ").toLowerCase();
    const skillsW = (u.skillsWant || u.skillsLearning || []).join(" ").toLowerCase();
    return name.includes(q) || skillsH.includes(q) || skillsW.includes(q);
  });

  const userName = userProfile?.username || userProfile?.name || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();
  const messagesCount = chats.length;

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchProfile(),
          fetchChats(),
          fetchNotifications(),
          fetchConnectionsCount(),
          fetchPendingRequestsCount(),
          fetchMeetingsCount(),
        ]);
        const matchesData = await fetchMatches();
        if (matchesData.length > 0) {
          await fetchStatus(matchesData);
        }
      } catch (err) {
        console.error("Load data error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  if (loading) {
    return (
      <div className="sd-layout" style={{ alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "#F97316", fontSize: "1.1rem", fontWeight: "700", letterSpacing: "-0.01em" }}>
          Loading SkillSwap SaaS Dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className={`sd-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {mobileMenuOpen && (
        <div
          className="sd-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sd-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sd-sidebar-top">
          <div className="sd-brand">
            <div className="sd-logo-group" onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }}>
              <div className="sd-logo-icon">⚡</div>
              <span className="sd-logo-text">
                Skill<span className="sd-logo-accent">Swap</span>
              </span>
            </div>
            <button
              className="sd-collapse-btn"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "»" : "«"}
            </button>
          </div>

          <nav className="sd-nav-list">
            <button className="sd-nav-item active" onClick={() => { setMobileMenuOpen(false); navigate("/dashboard"); }}>
              <div className="sd-nav-item-left">
                <span className="sd-nav-icon">🏠</span>
                <span className="sd-nav-label">Dashboard</span>
              </div>
            </button>

            <button className="sd-nav-item" onClick={() => { setMobileMenuOpen(false); navigate("/profile"); }}>
              <div className="sd-nav-item-left">
                <span className="sd-nav-icon">👤</span>
                <span className="sd-nav-label">Profile</span>
              </div>
            </button>

            <button className="sd-nav-item" onClick={() => { setMobileMenuOpen(false); navigate("/requests"); }}>
              <div className="sd-nav-item-left">
                <span className="sd-nav-icon">🔔</span>
                <span className="sd-nav-label">Requests</span>
              </div>
              {(notifications.length > 0 || pendingRequestsCount > 0) && (
                <span className="sd-nav-badge">{pendingRequestsCount || notifications.length}</span>
              )}
            </button>

            <button className="sd-nav-item" onClick={() => { setMobileMenuOpen(false); navigate("/connections"); }}>
              <div className="sd-nav-item-left">
                <span className="sd-nav-icon">🤝</span>
                <span className="sd-nav-label">Connections</span>
              </div>
              {connectionsCount > 0 && (
                <span className="sd-nav-badge" style={{ backgroundColor: "#27272A", color: "#A1A1AA" }}>
                  {connectionsCount}
                </span>
              )}
            </button>

            <button className="sd-nav-item" onClick={() => { setMobileMenuOpen(false); handleMessagesClick(); }}>
              <div className="sd-nav-item-left">
                <span className="sd-nav-icon">💬</span>
                <span className="sd-nav-label">Messages</span>
              </div>
              {messagesCount > 0 && (
                <span className="sd-nav-badge">{messagesCount}</span>
              )}
            </button>

            <button className="sd-nav-item" onClick={() => { setMobileMenuOpen(false); handleAiWorkspaceClick(); }}>
              <div className="sd-nav-item-left">
                <span className="sd-nav-icon">🤖</span>
                <span className="sd-nav-label">AI Workspace</span>
              </div>
            </button>

            <button className="sd-nav-item" onClick={() => { setMobileMenuOpen(false); navigate("/profile"); }}>
              <div className="sd-nav-item-left">
                <span className="sd-nav-icon">⚙️</span>
                <span className="sd-nav-label">Settings</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="sd-sidebar-footer">
          <div className="sd-user-card">
            <div className="sd-user-info-group">
              <div className="sd-avatar-wrap">
                <div className="sd-avatar">{userInitials}</div>
                <div className="sd-online-indicator" />
              </div>
              <div className="sd-user-details">
                <span className="sd-user-name">{userName}</span>
                <span className="sd-user-role">Full Stack Developer</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="sd-main">
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button
              className="sd-mobile-menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div className="sd-search-container">
              <span className="sd-search-icon">🔍</span>
              <input
                type="text"
                className="sd-search-input"
                placeholder="Search users, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="sd-search-kbd">/</span>
            </div>
          </div>

          <div className="sd-topbar-actions">
            <div className="sd-notif-wrapper" ref={notifRef}>
              <button
                className="sd-icon-btn"
                onClick={handleBellClick}
                aria-label="Notifications"
              >
                🔔
                {notifications.length > 0 && <span className="sd-notif-dot" />}
              </button>

              {showNotifications && (
                <div className="sd-notif-dropdown">
                  <div className="sd-notif-header">
                    <span className="sd-notif-title">Notifications</span>
                    <span style={{ fontSize: "0.75rem", color: "#A1A1AA" }}>
                      {notifications.length} unread
                    </span>
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.83rem", color: "#71717A", padding: "0.5rem 0" }}>
                      No new notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className="sd-notif-item"
                        onClick={() => handleNotificationClick(n._id)}
                      >
                        {n.text}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="sd-user-chip" onClick={() => navigate("/profile")}>
              <div className="sd-chip-avatar">{userInitials}</div>
              <span className="sd-chip-name">{userName}</span>
            </div>

            <button className="sd-btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="sd-content-container">
          <section className="sd-hero-card">
            <div className="sd-hero-left">
              <div className="sd-hero-tag">⚡ SKILLSWAP SAAS PLATFORM</div>
              <h1 className="sd-hero-title">Welcome back, {userName}! 👋</h1>
              <p className="sd-hero-subtitle">
                Connect with peer developers, exchange skills 1-on-1, and accelerate your tech career through active peer learning.
              </p>
              <button
                className="sd-btn-primary"
                onClick={() => navigate("/connections")}
              >
                Find Learning Partner →
              </button>
            </div>
            <div className="sd-hero-illustration">👨‍💻</div>
          </section>

          <section className="sd-stats-grid">
            <div
              className="sd-stat-card"
              onClick={() => navigate("/connections")}
              style={{ cursor: "pointer" }}
            >
              <div className="sd-stat-icon-wrapper" style={{ color: "#F97316" }}>👥</div>
              <div className="sd-stat-content">
                <span className="sd-stat-value">{connectionsCount}</span>
                <span className="sd-stat-label">Connections</span>
                <span className="sd-stat-subtext">Active network</span>
              </div>
            </div>

            <div
              className="sd-stat-card"
              onClick={handleMessagesClick}
              style={{ cursor: "pointer" }}
            >
              <div className="sd-stat-icon-wrapper" style={{ color: "#F97316" }}>💬</div>
              <div className="sd-stat-content">
                <span className="sd-stat-value">{messagesCount}</span>
                <span className="sd-stat-label">Active Chats</span>
                <span className="sd-stat-subtext">
                  {messagesCount > 0 ? `${messagesCount} conversations` : "Start a chat"}
                </span>
              </div>
            </div>

            <div
              className="sd-stat-card"
              onClick={() => navigate("/sessions")}
              style={{ cursor: "pointer" }}
            >
              <div className="sd-stat-icon-wrapper" style={{ color: "#F97316" }}>📅</div>
              <div className="sd-stat-content">
                <span className="sd-stat-value">{meetingsCount}</span>
                <span className="sd-stat-label">Scheduled Meetings</span>
                <span className="sd-stat-subtext">
                  {meetingsCount > 0 ? "Booked sessions" : "No upcoming"}
                </span>
              </div>
            </div>

            <div
              className="sd-stat-card"
              onClick={() => navigate("/connections")}
              style={{ cursor: "pointer" }}
            >
              <div className="sd-stat-icon-wrapper" style={{ color: "#F97316" }}>🎯</div>
              <div className="sd-stat-content">
                <span className="sd-stat-value">{matches.length}</span>
                <span className="sd-stat-label">Skill Matches</span>
                <span className="sd-stat-subtext">Compatible partners</span>
              </div>
            </div>
          </section>

          <section className="sd-section">
            <div className="sd-section-header">
              <h2 className="sd-section-title">Suggested Learning Partners 🔥</h2>
              <button
                className="sd-btn-link"
                onClick={() => navigate("/connections")}
              >
                View All →
              </button>
            </div>

            {filteredMatches.length === 0 ? (
              <div
                style={{
                  backgroundColor: "var(--surface-dark)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  padding: "2.5rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No users found matching your search. Try searching for specific skills or names.
              </div>
            ) : (
              <div className="sd-users-grid">
                {filteredMatches.slice(0, 3).map((u, i) => {
                  const st = statusMap[u._id] || "none";
                  const uName = u.username || u.name || "User";
                  const matchPercent = Math.max(78, 96 - i * 4);
                  const hasSkill = u.skillsHave?.[0] || u.skillsProficient?.[0] || "React";
                  const wantSkill = u.skillsWant?.[0] || u.skillsLearning?.[0] || "Node.js";

                  return (
                    <div key={u._id || i} className="sd-user-card-item">
                      <span className="sd-match-badge">{matchPercent}% Match</span>

                      <div className="sd-card-user-header">
                        <div className="sd-card-avatar">
                          {uName.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="sd-card-user-info">
                          <span className="sd-card-user-name">{uName}</span>
                          <span className="sd-card-user-role">{u.bio || "Software Engineer"}</span>
                        </div>
                      </div>

                      <div className="sd-skills-container">
                        <div className="sd-skill-block">
                          <span className="sd-skill-meta-label">TEACHES</span>
                          <div className="sd-tag-group">
                            <span className="sd-chip have">{hasSkill}</span>
                          </div>
                        </div>
                        <div className="sd-skill-block">
                          <span className="sd-skill-meta-label">WANTS TO LEARN</span>
                          <div className="sd-tag-group">
                            <span className="sd-chip">{wantSkill}</span>
                          </div>
                        </div>
                      </div>

                      <div className="sd-card-actions">
                        <button
                          className="sd-btn-outline"
                          onClick={() => navigate("/profile")}
                        >
                          View Profile
                        </button>

                        {st === "accepted" ? (
                          <button
                            className="sd-btn-accent"
                            onClick={() => navigate(`/chat/${u._id}`)}
                          >
                            Chat 💬
                          </button>
                        ) : st === "sent" ? (
                          <button className="sd-btn-disabled" disabled>
                            Pending ⏳
                          </button>
                        ) : st === "loading" ? (
                          <button className="sd-btn-disabled" disabled>
                            Sending...
                          </button>
                        ) : (
                          <button
                            className="sd-btn-accent"
                            onClick={() => handleConnect(u._id)}
                          >
                            Connect 🤝
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="sd-section" id="ai-workspace">
            <div className="sd-section-header">
              <div>
                <h2 className="sd-section-title">AI Skill Workspace ⚡</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Supercharge your learning journey with our suite of developer AI tools.
                </p>
              </div>
            </div>

            <div className="sd-ai-workspace-grid">
              <div
                className="sd-ai-feature-card"
                onClick={() => navigate("/ai-mentor")}
              >
                <div className="sd-ai-card-top">
                  <div className="sd-ai-icon-box">🤖</div>
                  <h3 className="sd-ai-card-title">AI Mentor</h3>
                  <p className="sd-ai-card-desc">
                    Get 24/7 technical guidance, instant debugging assistance, and mock interview prep tailored to your stack.
                  </p>
                </div>
                <div className="sd-ai-card-action">
                  Launch Mentor →
                </div>
              </div>

              <div
                className="sd-ai-feature-card"
                onClick={() => navigate("/ai-roadmap")}
              >
                <div className="sd-ai-card-top">
                  <div className="sd-ai-icon-box">🗺️</div>
                  <h3 className="sd-ai-card-title">AI Roadmap Generator</h3>
                  <p className="sd-ai-card-desc">
                    Generate structured, step-by-step personalized learning roadmaps for any technology or career transition goal.
                  </p>
                </div>
                <div className="sd-ai-card-action">
                  Create Roadmap →
                </div>
              </div>

              <div
                className="sd-ai-feature-card"
                onClick={() => navigate("/resume-review")}
              >
                <div className="sd-ai-card-top">
                  <div className="sd-ai-icon-box">📋</div>
                  <h3 className="sd-ai-card-title">Resume Analyzer</h3>
                  <p className="sd-ai-card-desc">
                    Analyze your technical resume, optimize for ATS screening, and receive actionable suggestions for top roles.
                  </p>
                </div>
                <div className="sd-ai-card-action">
                  Analyze Resume →
                </div>
              </div>
            </div>
          </section>

          <div className="sd-bottom-grid">
            <section className="sd-card-panel">
              <div className="sd-section-header">
                <h3 className="sd-section-title" style={{ fontSize: "1.1rem" }}>
                  Upcoming Meetings 📅
                </h3>
                <button
                  className="sd-btn-link"
                  onClick={() => navigate("/sessions")}
                >
                  View Schedule →
                </button>
              </div>

              <div className="sd-empty-state">
                <div className="sd-empty-icon">📆</div>
                <h4 className="sd-empty-title">
                  {meetingsCount > 0 ? `${meetingsCount} Sessions Booked` : "No upcoming meetings today"}
                </h4>
                <p className="sd-empty-desc">
                  Schedule 1-on-1 skill swap sessions with your connections to learn interactively.
                </p>
                <button
                  className="sd-btn-primary"
                  style={{ fontSize: "0.85rem", padding: "0.6rem 1.2rem", marginTop: "0.3rem" }}
                  onClick={() => navigate("/sessions")}
                >
                  Schedule Session 📅
                </button>
              </div>
            </section>

            <section className="sd-card-panel">
              <div className="sd-section-header">
                <h3 className="sd-section-title" style={{ fontSize: "1.1rem" }}>
                  Recent Activity ⚡
                </h3>
                <button
                  className="sd-btn-link"
                  onClick={() => navigate("/requests")}
                >
                  View All →
                </button>
              </div>

              <div className="sd-activity-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 3).map((n, idx) => (
                    <div key={n._id || idx} className="sd-activity-item">
                      <div className="sd-activity-avatar">
                        {(n.text || "N").substring(0, 1).toUpperCase()}
                      </div>
                      <div className="sd-activity-info">
                        <span className="sd-activity-text">{n.text}</span>
                        <span className="sd-activity-time">Just now</span>
                      </div>
                      <span style={{ color: "#22C55E", fontSize: "0.85rem" }}>✓</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="sd-activity-item">
                      <div className="sd-activity-avatar" style={{ color: "#F97316" }}>S</div>
                      <div className="sd-activity-info">
                        <span className="sd-activity-text">
                          <strong>Sarah</strong> accepted your connection request
                        </span>
                        <span className="sd-activity-time">2h ago</span>
                      </div>
                      <span style={{ color: "#22C55E", fontSize: "0.85rem" }}>✓</span>
                    </div>

                    <div className="sd-activity-item">
                      <div className="sd-activity-avatar" style={{ color: "#F97316" }}>A</div>
                      <div className="sd-activity-info">
                        <span className="sd-activity-text">
                          <strong>Alex</strong> sent you a connection request
                        </span>
                        <span className="sd-activity-time">5h ago</span>
                      </div>
                      <span style={{ color: "#22C55E", fontSize: "0.85rem" }}>✓</span>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
