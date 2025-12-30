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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from("shops").select("*").order("name");
    if (data) setUsers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingUser) {
        // Update shop name
        const { error: shopError } = await supabase
          .from("shops")
          .update({ name: formData.shopName })
          .eq("id", editingUser.id);

        if (shopError) throw shopError;

        // Note: Password update requires admin privileges
        // For now, users need to reset password via email
        if (formData.password) {
          setError(
            "Password update requires the user to reset via email. User has been notified."
          );
        }
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.username,
            password: formData.password,
          }
        );

        if (authError) throw authError;

        // Wait a moment for user to be created
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create shop entry
        const { error: shopError } = await supabase.from("shops").insert([
          {
            name: formData.shopName,
            user_id: authData.user.id,
          },
        ]);

        if (shopError) throw shopError;
      }

      setShowForm(false);
      setEditingUser(null);
      setFormData({ shopName: "", username: "", password: "" });
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
      // Only delete the shop entry - user auth account remains
      const { error: shopError } = await supabase
        .from("shops")
        .delete()
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

              {!editingUser && (
                <div className="form-group">
                  <label>Username (Email)</label>
                  <input
                    type="email"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    User will need to confirm their email before logging in
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>{editingUser ? "New Password" : "Password"}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                  minLength={6}
                />
                {editingUser && (
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    Note: Password changes are currently disabled. Ask user to
                    reset via email.
                  </small>
                )}
              </div>

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
              Note: This will remove the shop but the user account will remain
              in the system.
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
