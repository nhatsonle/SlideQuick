// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Presentation from './pages/Presentation';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { currentUser, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return null;
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
          <Route path="/" element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          } />
          <Route path="/home" element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          } />
          <Route path="/editor/:projectId" element={
            <RequireAuth>
              <Editor />
            </RequireAuth>
          } />
          <Route path="/present/:projectId" element={
            <RequireAuth>
              <Presentation />
            </RequireAuth>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;