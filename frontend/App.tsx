import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AppProvider, useApp } from "./src/context/AppContext";
import Home from "./src/pages/Home";
import Editor from "./src/pages/Editor";
import Presentation from "./src/pages/Presentation";
import Login from "./src/pages/Login";
import Register from "./src/pages/Register";
import "./App.css";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { currentUser, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return null;
  }

  // Allow access if share query param is present
  const query = new URLSearchParams(location.search);
  if (query.get('share')) {
    return children;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/editor/:projectId"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route
            path="/present/:projectId"
            element={
              <RequireAuth>
                <Presentation />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
