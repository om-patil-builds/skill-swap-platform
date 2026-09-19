import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Profile from "./pages/profile";
import Requests from "./pages/Requests";
import Connections from "./pages/Connections";
import Sessions from "./pages/Sessions";
import AiMentor from "./pages/AiMentor";
import LearningRoadmap from "./pages/LearningRoadmap";
import ResumeReview from "./pages/ResumeReview";
import AuthGuard from "./components/AuthGuard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />
      <Route
        path="/chat/:userId"
        element={
          <AuthGuard>
            <Chat />
          </AuthGuard>
        }
      />
      <Route
        path="/chat"
        element={
          <AuthGuard>
            <Connections />
          </AuthGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <AuthGuard>
            <Profile />
          </AuthGuard>
        }
      />
      <Route
        path="/profile/:id"
        element={
          <AuthGuard>
            <Profile />
          </AuthGuard>
        }
      />
      <Route
        path="/requests"
        element={
          <AuthGuard>
            <Requests />
          </AuthGuard>
        }
      />
      <Route
        path="/connections"
        element={
          <AuthGuard>
            <Connections />
          </AuthGuard>
        }
      />
      <Route
        path="/sessions"
        element={
          <AuthGuard>
            <Sessions />
          </AuthGuard>
        }
      />
      <Route
        path="/ai-mentor"
        element={
          <AuthGuard>
            <AiMentor />
          </AuthGuard>
        }
      />
      <Route
        path="/ai-roadmap"
        element={
          <AuthGuard>
            <LearningRoadmap />
          </AuthGuard>
        }
      />
      <Route
        path="/resume-review"
        element={
          <AuthGuard>
            <ResumeReview />
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default App;
