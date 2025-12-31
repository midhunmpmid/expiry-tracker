import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

function ProductsManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) {
      setCategories(data);
      // Start with all collapsed
      const collapsed = {};
      data.forEach((cat) => (collapsed[cat.id] = false));
      setExpandedCategories(collapsed);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select(
        `
        *,
        categories (id, name)
      `
      )
      .order("name");
    if (data) setProducts(data);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getProductsByCategory = (categoryId) => {
    return products.filter((p) => p.category_id === categoryId);
  };

  const getSortedCategories = () => {
    return [...categories].sort((a, b) => {
      const countA = getProductsByCategory(a.id).length;
      const countB = getProductsByCategory(b.id).length;
      return countB - countA; // Most products first
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Failed to upload image: " + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    console.log("Uploaded image URL:", data.publicUrl);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = editingProduct?.image_url || null;

    if (formData.image) {
      imageUrl = await handleImageUpload(formData.image);
    }

    const productData = {
      name: formData.name,
      category_id: formData.category_id,
      image_url: imageUrl,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (!error) {
        setEditingProduct(null);
        setShowForm(false);
      }
    } else {
      const { error } = await supabase.from("products").insert([productData]);

      if (!error) {
        setShowForm(false);
      }
    }

    setFormData({ name: "", category_id: "", image: null });
    fetchProducts();
    setLoading(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      image: null,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    setLoading(true);
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (!error) {
      fetchProducts();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({ name: "", category_id: "", image: null });
  };

  const sortedCategories = getSortedCategories();

  return (
    <div className="manager-section">
      <div className="section-header">
        <h2>Manage Products</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Product
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingProduct ? "Edit Product" : "Add New Product"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Product Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                />
                {editingProduct?.image_url && !formData.image && (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={editingProduct.image_url}
                      alt="Current"
                      style={{ maxWidth: "100px", borderRadius: "4px" }}
                    />
                  </div>
                )}
              </div>

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

      <div className="category-groups">
        {sortedCategories.map((category) => {
          const categoryProducts = getProductsByCategory(category.id);

          return (
            <div key={category.id} className="category-group">
              <div
                className="category-header"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="category-title">
                  <span className="expand-icon">
                    {expandedCategories[category.id] ? "▼" : "▶"}
                  </span>
                  <h3>{category.name}</h3>
                  <span className="product-count">
                    ({categoryProducts.length})
                  </span>
                </div>
              </div>

              {expandedCategories[category.id] && (
                <div className="category-content">
                  {categoryProducts.length === 0 ? (
                    <div className="empty-category">
                      No products in this category
                    </div>
                  ) : (
                    <div className="inventory-list">
                      {categoryProducts.map((product) => (
                        <div key={product.id} className="inventory-item">
                          <div className="item-image">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} />
                            ) : (
                              <div className="no-image">📦</div>
                            )}
                          </div>
                          <div className="item-details">
                            <h4>{product.name}</h4>
                          </div>
                          <div className="item-menu">
                            <button className="menu-button">⋮</button>
                            <div className="menu-dropdown">
                              <button onClick={() => handleEdit(product)}>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="delete-option"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductsManager;
