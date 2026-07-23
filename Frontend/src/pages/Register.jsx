import { useState } from "react";
import API from "../services/api";
import "./form.css";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setEmail(value);
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (trimmedPassword.length < 5) {
      setError("Password must be at least 5 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/register", {
        username: trimmedUsername,
        email: trimmedEmail.toLowerCase(),
        password: trimmedPassword,
      });

      const user = res.data.user || res.data;

      localStorage.setItem("userId", user._id || user.id);
      localStorage.setItem("userName", user.username);

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      console.log("Register error:", err);

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || "";

        if (status === 409) {
          if (message.toLowerCase().includes("email")) {
            setError("This email is already registered.");
          } else {
            setError("Username already exists.");
          }
        } else if (status === 400) {
          setError(message || "Invalid request. Please check your input.");
        } else if (status === 500) {
          setError("Server error. Please try again later.");
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
        <h1 className="auth-card-title">Create your account</h1>
        <p className="auth-card-subtitle">Join SkillSwap and start learning with peers</p>

        {error && (
          <div className="auth-message auth-message-error" style={{ color: "#f87171", marginBottom: "0.75rem", fontSize: "0.88rem" }}>{error}</div>
        )}
        {success && (
          <div className="auth-message auth-message-success" style={{ color: "#4ade80", marginBottom: "0.75rem", fontSize: "0.88rem" }}>{success}</div>
        )}

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="reg-username">Username</label>
          <input
            id="reg-username"
            type="text"
            className="auth-input"
            placeholder="e.g. johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={loading}
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="reg-email">Email address</label>
          <input
            id="reg-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={handleEmailChange}
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="reg-password">Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              className="auth-input"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              disabled={loading}
              style={{ paddingRight: "2.5rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#A3A3A3",
                cursor: "pointer",
                fontSize: "1rem",
                padding: "0.25rem",
                lineHeight: 1,
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button
          id="register-submit"
          className="auth-btn"
          onClick={handleRegister}
          disabled={loading}
          style={loading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <button
            className="auth-footer-link"
            onClick={() => navigate("/")}
          >
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
}

export default Register;
