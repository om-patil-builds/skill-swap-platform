import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";
import MatchCard from "../components/MatchCard";

function Dashboard() {
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [matches, setMatches] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // 🔹 Fetch chats
  const fetchChats = async () => {
    try {
      const res = await API.get("/chat/list");
      setChats(res.data.chats || []);
    } catch (err) {
      console.log(err);
    }
  };

  // 🔹 Fetch matches
  const fetchMatches = async () => {
    try {
      const res = await API.get("/users/matches");
      const data = res.data.matches || [];
      setMatches(data);
      return data;
    } catch (err) {
      console.log(err);
      return [];
    }
  };

  // 🔹 Fetch request status (optimized 🚀)
  const fetchStatus = async (users) => {
    try {
      const promises = users.map((user) =>
        API.get(`/requests/status/${user._id}`),
      );

      const responses = await Promise.all(promises);

      const map = {};
      users.forEach((user, index) => {
        map[user._id] = responses[index].data.status || "none";
      });

      setStatusMap(map);
    } catch (err) {
      console.log(err);
    }
  };
  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // 🔔 Toggle dropdown only — do NOT mark anything as read here
  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
  };

  // 🔔 Mark one notification as read when the user clicks it, then go to Requests
  const handleNotificationClick = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      // Remove from local list so badge updates immediately
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setShowNotifications(false);
      navigate("/requests");
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 🔹 Handle connect
  const handleConnect = async (userId) => {
    try {
      const res = await API.post("/requests/send", {
        receiverId: userId,
      });

      console.log(res.data);

      setStatusMap((prev) => ({
        ...prev,
        [userId]: "sent",
      }));
    } catch (err) {
      const message = err.response?.data?.message;

      // Already request exists
      if (message === "Request already exists between users") {
        setStatusMap((prev) => ({
          ...prev,
          [userId]: "sent",
        }));

        return;
      }

      console.log(message);
    }
  };

  // 🔹 Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchChats();
        const matchesData = await fetchMatches();

        if (matchesData.length > 0) {
          await fetchStatus(matchesData);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 🔹 Logout
  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  // 🔹 Loading UI
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>SkillSwap 💬</h1>

        <div className="header-action">
          <div className="notification-wrapper">
            <button className="notification-btn" onClick={handleBellClick}>
              🔔
              {notifications.length > 0 && (
                <span className="notification-count">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                {notifications.length === 0 ? (
                  <p>No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className="notification-item unread"
                      onClick={() => handleNotificationClick(n._id)}
                    >
                      {n.text}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Chats Section */}
      {/* <h2 className="chat-title">Your Chats</h2>

      {chats.length === 0 ? (
        <p className="no-chat">No chats yet</p>
      ) : (
        chats.map((chat) => (
          <div
            key={chat._id}
            className="chat-card"
            onClick={() => navigate(`/chat/${chat.otherUserId}`)}
          >
            <p>
              <b>User:</b> {chat.otherUserId}
            </p>
            <p>{chat.lastMessage}</p>
          </div>
        ))
      )} */}

      {/* Matches Section */}
      <h2 className="chat-title">Suggested Users 🔥</h2>

      {matches.length === 0 ? (
        <p className="no-chat">No matches found</p>
      ) : (
        <div className="matches-grid">
          {matches.map((user) => (
            <MatchCard
              key={user._id}
              user={user}
              status={statusMap[user._id] || "none"}
              onConnect={handleConnect}
            />
          ))}
        </div>
      )}

      {/* Navigation Buttons */}
      <nav className="dashboard-nav">
        <button onClick={() => navigate("/profile")}>Go to Profile</button>
        <button onClick={() => navigate("/requests")}>Requests 🔔</button>
        <button onClick={() => navigate("/connections")}>Connections 🤝</button>
      </nav>
    </div>
  );
}

export default Dashboard;
