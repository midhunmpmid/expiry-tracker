// src/components/UsersManager.js
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function UsersManager() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [formData, setFormData] = useState({
    shopName: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("shops")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setUsers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingUser) {
        // Update shop name only
        const { error: shopError } = await supabase
          .from("shops")
          .update({ name: formData.shopName })
          .eq("id", editingUser.id);

        if (shopError) throw shopError;
      } else {
        // Check if an inactive shop with the same name exists
        const { data: existingShop } = await supabase
          .from("shops")
          .select("*")
          .eq("name", formData.shopName)
          .eq("is_active", false)
          .single();

        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.username,
            password: formData.password,
          }
        );

        if (authError) throw authError;

        // Wait a moment for user to be created
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (existingShop) {
          // Reactivate existing shop with new credentials
          const { error: shopError } = await supabase
            .from("shops")
            .update({
              user_id: authData.user.id,
              username: formData.username,
              is_active: true,
            })
            .eq("id", existingShop.id);

          if (shopError) throw shopError;
        } else {
          // Create new shop entry
          const { error: shopError } = await supabase.from("shops").insert([
            {
              name: formData.shopName,
              user_id: authData.user.id,
              username: formData.username,
              is_active: true,
            },
          ]);

          if (shopError) throw shopError;
        }
      }

      setShowForm(false);
      setEditingUser(null);
      setFormData({ shopName: "", username: "", password: "" });
      setShowPassword(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || "An error occurred");
      console.error("User operation error:", err);
    }

    setLoading(false);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      shopName: user.name,
      username: "",
      password: "",
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    setDeletingUserId(userId);
  };

  const confirmDelete = async (user) => {
    if (deleteConfirmText !== "remove") {
      setError('Please type "remove" to confirm deletion');
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Soft delete - set is_active to false
      const { error: shopError } = await supabase
        .from("shops")
        .update({ is_active: false })
        .eq("id", user.id);

      if (shopError) {
        console.error("Shop delete error:", shopError);
        throw new Error("Failed to delete shop: " + shopError.message);
      }

      // Success
      setDeletingUserId(null);
      setDeleteConfirmText("");
      fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to delete user");
      console.error("Delete error:", err);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ shopName: "", username: "", password: "" });
    setError("");
    setShowPassword(false);
  };

  return (
    <div className="manager-section">
      <div className="section-header">
        <h2>Manage Users</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add User
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingUser ? "Edit User" : "Add New User"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Shop Name</label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={
                    editingUser
                      ? editingUser.username || "N/A"
                      : formData.username
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required={!editingUser}
                  disabled={!!editingUser}
                  style={
                    editingUser
                      ? { backgroundColor: "#f0f0f0", cursor: "not-allowed" }
                      : {}
                  }
                />
                {editingUser && (
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Username cannot be changed
                  </small>
                )}
              </div>

              {!editingUser ? (
                <div className="form-group">
                  <label>Password</label>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                      style={{ width: "100%", paddingRight: "60px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        background: "#e0e0e0",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        color: "#333",
                        cursor: "pointer",
                        fontSize: "12px",
                        padding: "4px 8px",
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <div
                    style={{
                      backgroundColor: "#fff3cd",
                      border: "1px solid #ffc107",
                      borderRadius: "4px",
                      padding: "12px",
                      fontSize: "14px",
                      color: "#856404",
                    }}
                  >
                    <strong>Note:</strong> To reset the password, delete this
                    user and recreate them with the same shop name. All user
                    data will be preserved.
                  </div>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUserId && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm User Deletion</h3>
            <p>
              Type <strong>remove</strong> to confirm deletion of this user:
            </p>
            <p className="user-name">
              {users.find((u) => u.id === deletingUserId)?.name}
            </p>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
              Note: User data will be preserved. If you recreate a user with the
              same shop name, their data will be restored.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type 'remove'"
              className="confirm-input"
            />
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button
                onClick={() =>
                  confirmDelete(users.find((u) => u.id === deletingUserId))
                }
                disabled={loading || deleteConfirmText !== "remove"}
                className="btn-delete"
              >
                {loading ? "Deleting..." : "Delete User"}
              </button>
              <button
                onClick={() => {
                  setDeletingUserId(null);
                  setDeleteConfirmText("");
                  setError("");
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="items-list">
        {users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            No users yet. Add your first user!
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="item user-item">
              <div>
                <strong>{user.name}</strong>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(user)} className="btn-edit">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UsersManager;
