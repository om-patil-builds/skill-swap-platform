import { useState } from "react";
import API from "../services/api";
import "./form.css"; // same styling reuse
import { useNavigate } from "react-router-dom";


function Register() {
   const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const res = await API.post("/auth/register", {
        username,
        email,
        password
      });

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
    <div className="login-container">
      <div className="login-box">
        <h2>Create Account 🚀</h2>

        <input
          type="text"
          placeholder="Enter Username"
          onChange={(e) => setUsername(e.target.value)}
        />

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

        <button onClick={handleRegister}>Register</button>

        <p onClick={() => navigate("/")} style={{ cursor: "pointer", color: "red" }}>
         Already have an account? Login
        </p>
      </div>
    </div>
  );
}

export default Register;