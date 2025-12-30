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

        // Update password if provided
        if (formData.password) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            editingUser.user_id,
            { password: formData.password }
          );

          if (authError) throw authError;
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
      setError(err.message);
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
      // Delete auth user (this will cascade delete shop)
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.user_id
      );
      if (authError) throw authError;

      setDeletingUserId(null);
      setDeleteConfirmText("");
      fetchUsers();
    } catch (err) {
      setError(err.message);
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
                </div>
              )}

              <div className="form-group">
                <label>
                  {editingUser
                    ? "New Password (leave blank to keep current)"
                    : "Password"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                  minLength={6}
                />
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
        {users.map((user) => (
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
        ))}
      </div>
    </div>
  );
}

export default UsersManager;
