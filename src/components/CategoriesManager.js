import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    setLoading(true);
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (!error) {
      fetchCategories();
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
                    onClick={() => handleDelete(category.id)}
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
