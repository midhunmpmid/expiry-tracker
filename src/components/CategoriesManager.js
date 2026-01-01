import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("categories")
      .insert([{ name: newCategory.trim() }]);

    if (!error) {
      setNewCategory("");
      fetchCategories();
    }
    setLoading(false);
  };

  const handleEdit = async (id) => {
    if (!editingName.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("categories")
      .update({ name: editingName.trim() })
      .eq("id", id);

    if (!error) {
      setEditingId(null);
      setEditingName("");
      fetchCategories();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "remove") {
      setError('Please type "remove" to confirm deletion');
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", deletingCategory.id);

    if (!error) {
      setDeletingCategory(null);
      setDeleteConfirmText("");
      fetchCategories();
    } else {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="manager-section">
      <h2>Manage Categories</h2>

      <form onSubmit={handleAdd} className="add-form">
        <input
          type="text"
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="btn-primary">
          Add Category
        </button>
      </form>

      {deletingCategory && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Category Deletion</h3>
            <p>
              Type <strong>remove</strong> to confirm deletion of:
            </p>
            <p className="delete-product-name">
              <strong>{deletingCategory.name}</strong>
            </p>
            <div className="warning-box">
              ⚠️ Warning: Deleting this category will also remove all products
              that belong to it!
            </div>
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
                onClick={handleDelete}
                disabled={loading || deleteConfirmText !== "remove"}
                className="btn-delete"
              >
                {loading ? "Deleting..." : "Delete Category"}
              </button>
              <button
                onClick={() => {
                  setDeletingCategory(null);
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
        {categories.map((category) => (
          <div key={category.id} className="item">
            {editingId === category.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => handleEdit(category.id)}
                  className="btn-save"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span>{category.name}</span>
                <div className="item-actions">
                  <button
                    onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingCategory(category)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoriesManager;
