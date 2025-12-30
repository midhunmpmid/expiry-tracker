import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import UserLogin from "./components/UserLogin";
import UserDashboard from "./components/UserDashboard";
import "./App.css";

function AppRoutes() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdminStatus(session.user.email);
      } else {
        setLoading(false);
        setAdminCheckComplete(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAdminCheckComplete(false);
      if (session) {
        checkAdminStatus(session.user.email);
      } else {
        setIsAdmin(false);
        setLoading(false);
        setAdminCheckComplete(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (email) => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", email)
        .maybeSingle();

      if (error) {
        console.error("Admin check error:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (err) {
      console.error("Admin check exception:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      setAdminCheckComplete(true);
    }
  };

  if (loading || !adminCheckComplete) {
    return <div className="loading">Loading...</div>;
  }

  // Determine the default redirect based on user type
  const getDefaultRedirect = () => {
    if (!session) return "/login";
    return isAdmin ? "/admin" : "/";
  };

  return (
    <Routes>
      {/* Admin Routes */}
      <Route
        path="/admin/login"
        element={
          !session ? (
            <AdminLogin />
          ) : isAdmin ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/login/admin"
        element={<Navigate to="/admin/login" replace />}
      />
      <Route
        path="/admin/*"
        element={
          session && isAdmin ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={
          session && isAdmin ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />

      {/* User Routes */}
      <Route
        path="/login"
        element={
          !session ? (
            <UserLogin />
          ) : isAdmin ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : isAdmin ? (
            <Navigate to="/admin" replace />
          ) : (
            <UserDashboard />
          )
        }
      />

      {/* Catch all - redirect to appropriate login */}
      <Route
        path="*"
        element={<Navigate to={getDefaultRedirect()} replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
