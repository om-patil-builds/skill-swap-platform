import { useState } from "react";
import API from "../services/api";
import "./form.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", { email, password });

      console.log("LOGIN:", res.data);

      // 🔥 support both structures
      const user = res.data.user || res.data;

      // 🔥 SAVE
      localStorage.setItem("userId", user._id || user.id);
      localStorage.setItem("userName", user.username);

      console.log("SAVED USER ID:", localStorage.getItem("userId"));

      alert("Login successful");
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      alert("Login failed");
    }
  };

  return (
    <main className="auth-page">
      {/* Brand */}
      <div className="auth-brand" onClick={() => navigate("/")}>
        <div className="auth-brand-icon">⚡</div>
        <span className="auth-brand-text">Skill<span>Swap</span></span>
      </div>

      {/* Card */}
      <div className="auth-card">
        <h1 className="auth-card-title">Welcome back</h1>
        <p className="auth-card-subtitle">Sign in to continue to SkillSwap</p>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="auth-input"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button id="login-submit" className="auth-btn" onClick={handleLogin}>
          Sign In
        </button>

        <p className="auth-footer">
          Don&apos;t have an account?{" "}
          <button
            className="auth-footer-link"
            onClick={() => navigate("/register")}
          >
            Create account
          </button>
        </p>
      </div>
    </main>
  );
}

export default Login;
