import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "./api/axios";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import EventForm from "./components/EventForm";
import EventList from "./components/EventList";
import NomineeForm from "./components/NomineeForm";
import NomineeList from "./components/NomineeList";
import FeedbackForm from "./components/FeedbackForm";
import NomineeResponse from "./components/NomineeResponse";
import Navbar from "./components/Navbar";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await API.get("/check-auth/");
      setIsAuthenticated(true);
      setUsername(res.data.username);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = async () => {
    try {
      await API.post("/logout/");
    } catch (err) {
      console.error("Logout error:", err);
    }
    setIsAuthenticated(false);
    setUsername("");
  };

  if (loading) {
    return (
      <div className="spinner-wrapper" style={{ minHeight: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Private route wrapper
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {isAuthenticated && <Navbar username={username} onLogout={handleLogout} />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/response" element={<NomineeResponse />} />
        <Route path="/feedback/:nomineeId" element={<FeedbackForm />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/events"
          element={
            <PrivateRoute>
              <EventList />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/new"
          element={
            <PrivateRoute>
              <EventForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <PrivateRoute>
              <EventForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/:eventId/nominees"
          element={
            <PrivateRoute>
              <NomineeList />
            </PrivateRoute>
          }
        />
        <Route
          path="/events/:eventId/nominees/add"
          element={
            <PrivateRoute>
              <NomineeForm />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
