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

    const res = await API.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    console.log("LOGIN:", res.data);

    // 🔥 support both structures
    const user =
      res.data.user || res.data;

    // 🔥 SAVE
    localStorage.setItem(
      "userId",
       user._id || user.id
    );

    localStorage.setItem(
      "userName",
      user.username
    );

    console.log(
      "SAVED USER ID:",
      localStorage.getItem(
        "userId"
      )
    );

    alert("Login successful");

    navigate("/dashboard");

  } catch (err) {

    console.log(err);

    alert("Login failed");
  }
};

  return (
    <main>
      <div className="login-container">
        <div className="login-box">
          <h2>SkillSwap Login 🚀</h2>

          <input
            type="email"
            placeholder="Enter Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login</button>

          <p
            onClick={() => navigate("/register")}
            style={{ cursor: "pointer", color: "red" }}
          >
            Don't have an account? Register
          </p>
        </div>
      </div>
    </main>
  );
}

export default Login;
