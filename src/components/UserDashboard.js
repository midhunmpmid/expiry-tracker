import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import "./UserDashboard.css";

function UserDashboard() {
  const [shop, setShop] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShop();
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (shop) {
      fetchInventory();
      fetchCategoryOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  const fetchShop = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching shop:", error);
        return;
      }

      if (data) setShop(data);
    } catch (err) {
      console.error("Exception fetching shop:", err);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");
    if (data) {
      setCategories(data);
      const expanded = {};
      data.forEach((cat) => (expanded[cat.id] = true));
      setExpandedCategories(expanded);
    }
  };

  const fetchCategoryOrders = async () => {
    if (!shop) return;

    const { data } = await supabase
      .from("category_orders")
      .select("*")
      .eq("shop_id", shop.id)
      .order("display_order");

    if (data && data.length > 0) {
      const orderedCategories = data
        .map((co) => categories.find((c) => c.id === co.category_id))
        .filter(Boolean);

      const unorderedCategories = categories.filter(
        (c) => !data.find((co) => co.category_id === c.id)
      );

      setCategories([...orderedCategories, ...unorderedCategories]);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, categories(id, name)")
      .order("name");

    if (data) setProducts(data);
  };

  const fetchInventory = async () => {
    const { data } = await supabase
      .from("inventory_items")
      .select(
        `
        *,
        products (
          id,
          name,
          image_url,
          category_id
        )
      `
      )
      .eq("shop_id", shop.id)
      .order("expiry_date");

    if (data) setInventory(data);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = useCallback((expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return "expired";
    if (days <= 5) return "critical";
    if (days <= 10) return "warning";
    return "ok";
  }, []);

  const getCategoryStatus = useCallback(
    (categoryId) => {
      const categoryItems = inventory.filter(
        (item) => item.products?.category_id === categoryId
      );

      let hasCritical = false;
      let hasWarning = false;

      categoryItems.forEach((item) => {
        const status = getExpiryStatus(item.expiry_date);
        if (status === "critical" || status === "expired") {
          hasCritical = true;
        } else if (status === "warning") {
          hasWarning = true;
        }
      });

      if (hasCritical) return "critical";
      if (hasWarning) return "warning";
      return "ok";
    },
    [inventory, getExpiryStatus]
  );

  const getInventoryByCategory = (categoryId) => {
    return inventory.filter(
      (item) => item.products?.category_id === categoryId
    );
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleDragStart = (e, category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory.id === targetCategory.id) return;

    const draggedIndex = categories.findIndex(
      (c) => c.id === draggedCategory.id
    );
    const targetIndex = categories.findIndex((c) => c.id === targetCategory.id);

    const newCategories = [...categories];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    // Save to database
    const updates = newCategories.map((cat, index) => ({
      shop_id: shop.id,
      category_id: cat.id,
      display_order: index,
    }));

    // Delete existing orders
    await supabase.from("category_orders").delete().eq("shop_id", shop.id);

    // Insert new orders
    await supabase.from("category_orders").insert(updates);

    setCategories(newCategories);
    setDraggedCategory(null);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("inventory_items").insert([
      {
        shop_id: shop.id,
        product_id: selectedProduct,
        expiry_date: expiryDate,
      },
    ]);

    if (!error) {
      setShowAddForm(false);
      setSelectedProduct("");
      setExpiryDate("");
      fetchInventory();
    }

    setLoading(false);
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("inventory_items")
      .update({ expiry_date: expiryDate })
      .eq("id", editingItem.id);

    if (!error) {
      setShowEditForm(false);
      setEditingItem(null);
      setExpiryDate("");
      fetchInventory();
    }

    setLoading(false);
  };

  const handleDeleteItem = async () => {
    setLoading(true);

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", deletingItem.id);

    if (!error) {
      setShowDeleteConfirm(false);
      setDeletingItem(null);
      fetchInventory();
    }

    setLoading(false);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setExpiryDate(item.expiry_date);
    setShowEditForm(true);
  };

  const openDeleteModal = (item) => {
    setDeletingItem(item);
    setShowDeleteConfirm(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!shop)
    return (
      <div className="loading">
        <p>Loading shop information...</p>
        <p style={{ fontSize: "14px", marginTop: "10px" }}>
          If this persists, please contact your administrator.
        </p>
      </div>
    );

  return (
    <div className="user-dashboard">
      <div className="user-header">
        <h1>{shop.name}</h1>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <button onClick={() => setShowAddForm(true)} className="btn-add-item">
        + Add Item
      </button>

      <div className="drag-hint">💡 Drag categories to reorder them</div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.categories?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
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
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedProduct("");
                    setExpiryDate("");
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && editingItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Expiry Date</h3>
            <p>
              <strong>{editingItem.products.name}</strong>
            </p>
            <form onSubmit={handleEditItem}>
              <div className="form-group">
                <label>New Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
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
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingItem(null);
                    setExpiryDate("");
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && deletingItem && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to remove:</p>
            <p className="delete-product-name">
              <strong>{deletingItem.products.name}</strong>
            </p>

            <div className="modal-actions">
              <button
                onClick={handleDeleteItem}
                disabled={loading}
                className="btn-delete"
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingItem(null);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="category-groups">
        {categories.map((category) => {
          const categoryItems = getInventoryByCategory(category.id);
          const categoryStatus = getCategoryStatus(category.id);

          return (
            <div
              key={category.id}
              className="category-group"
              draggable
              onDragStart={(e) => handleDragStart(e, category)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category)}
            >
              <div
                className={`category-header ${categoryStatus}`}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="category-title">
                  <span className="drag-handle">⋮⋮</span>
                  <span className="expand-icon">
                    {expandedCategories[category.id] ? "▼" : "▶"}
                  </span>
                  <h3>{category.name}</h3>
                  <span className="product-count">
                    ({categoryItems.length})
                  </span>
                </div>
              </div>

              {expandedCategories[category.id] && (
                <div className="category-content">
                  {categoryItems.length === 0 ? (
                    <div className="empty-category">
                      No items in this category
                    </div>
                  ) : (
                    <div className="inventory-list">
                      {categoryItems.map((item) => {
                        const status = getExpiryStatus(item.expiry_date);

                        return (
                          <div
                            key={item.id}
                            className={`inventory-item ${status}`}
                          >
                            <div className="item-image">
                              {item.products.image_url ? (
                                <img
                                  src={item.products.image_url}
                                  alt={item.products.name}
                                />
                              ) : (
                                <div className="no-image">No Image</div>
                              )}
                            </div>

                            <div className="item-details">
                              <h4>{item.products.name}</h4>
                              {status === "expired" ? (
                                <p className="expiry-text expired-text">
                                  <strong>EXPIRED</strong>
                                </p>
                              ) : (
                                <p className="expiry-text">
                                  Expires:{" "}
                                  {new Date(
                                    item.expiry_date
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            <div className="item-menu">
                              <button className="menu-button">⋮</button>
                              <div className="menu-dropdown">
                                <button onClick={() => openEditModal(item)}>
                                  Edit Date
                                </button>
                                <button
                                  onClick={() => openDeleteModal(item)}
                                  className="delete-option"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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

export default UserDashboard;
