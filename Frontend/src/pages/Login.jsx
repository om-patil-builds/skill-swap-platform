import { useState } from "react";
import API from "../services/api";
import "./form.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/login", {
        email: trimmedEmail.toLowerCase(),
        password: trimmedPassword,
      });

      const user = res.data.user || res.data;

      localStorage.setItem("userId", user._id || user.id);
      localStorage.setItem("userName", user.username);

      setSuccess("Login successful!");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      console.log("Login error:", err);

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || "";

        if (status === 404) {
          setError("Email is not registered.");
        } else if (status === 401) {
          if (message === "Invalid password") {
            setError("Incorrect password.");
          } else if (message.includes("Unauthorized") || message.includes("No token")) {
            setError("Unauthorized. Please log in again.");
          } else {
            setError("Unauthorized. Please log in again.");
          }
        } else if (status === 500) {
          setError("Server error. Please try again later.");
        } else if (status === 400) {
          setError(message || "Invalid request. Please check your input.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-brand" onClick={() => navigate("/")}>
        <div className="auth-brand-icon">⚡</div>
        <span className="auth-brand-text">Skill<span>Swap</span></span>
      </div>

      <div className="auth-card">
        <h1 className="auth-card-title">Welcome back</h1>
        <p className="auth-card-subtitle">Sign in to continue to SkillSwap</p>

        {error && (
          <div className="auth-message auth-message-error">{error}</div>
        )}
        {success && (
          <div className="auth-message auth-message-success" style={{ color: "#4ade80", marginBottom: "0.75rem", fontSize: "0.88rem" }}>{success}</div>
        )}

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="auth-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
          />
        </div>

        <button
          id="login-submit"
          className="auth-btn"
          onClick={handleLogin}
          disabled={loading}
          style={loading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button
            className="auth-footer-link"
            onClick={() => navigate("/register")}
          >
            Sign up
          </button>
        </p>
      </div>
    </main>
  );
}

export default Login;
