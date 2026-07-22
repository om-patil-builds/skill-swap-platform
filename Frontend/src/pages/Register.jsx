import { useState } from "react";
import API from "../services/api";
import "./form.css";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const res = await API.post("/auth/register", { username, email, password });

      console.log("REGISTER:", res.data);

      // Reuse the same auth storage logic as Login
      const user = res.data.user || res.data;

      localStorage.setItem("userId", user._id || user.id);
      localStorage.setItem("userName", user.username);

      console.log("SAVED USER ID:", localStorage.getItem("userId"));

      alert("Registration successful");
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      alert("Registration failed");
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
        <h1 className="auth-card-title">Create your account</h1>
        <p className="auth-card-subtitle">Join SkillSwap and start learning with peers</p>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="reg-username">Username</label>
          <input
            id="reg-username"
            type="text"
            className="auth-input"
            placeholder="e.g. johndoe"
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="reg-email">Email address</label>
          <input
            id="reg-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="auth-form-group">
          <label className="auth-label" htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            className="auth-input"
            placeholder="Create a strong password"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />
        </div>

        <button id="register-submit" className="auth-btn" onClick={handleRegister}>
          Create Account
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