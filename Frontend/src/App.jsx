import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import Connections from "./pages/Connections";
import Sessions from "./pages/Sessions";




function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} /> 
      <Route path="/chat/:userId" element={<Chat />} />
      <Route path="/profile" element={<Profile />} /> 
      <Route path="/requests" element={<Requests />} />
      <Route path="/connections" element={<Connections />} />

      <Route path="/sessions" element={<Sessions />} />

    </Routes>
    
  );
}

export default App;