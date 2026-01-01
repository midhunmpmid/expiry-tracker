import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import CategoriesManager from "./CategoriesManager";
import ProductsManager from "./ProductsManager";
import UsersManager from "./UsersManager";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    // Get saved tab from localStorage or default to 'categories'
    return localStorage.getItem("adminActiveTab") || "categories";
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab);
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("adminActiveTab");
    setShowLogoutConfirm(false);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
        <button
          className={`tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "categories" && <CategoriesManager />}
        {activeTab === "products" && <ProductsManager />}
        {activeTab === "users" && <UsersManager />}
      </div>
    </div>
  );
}

export default AdminDashboard;
