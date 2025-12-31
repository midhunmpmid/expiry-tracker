import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import "./UserDashboard.css";

function UserDashboard() {
  const [shop, setShop] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModalCategories, setExpandedModalCategories] = useState({});
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
    }
  }, [shop]);

  useEffect(() => {
    if (shop && inventory.length > 0) {
      // Auto-expand only red categories when inventory is loaded
      autoExpandCategories(inventory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, inventory.length]);

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
      .order("name");
    if (data) setCategories(data);
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

    if (data) {
      setInventory(data);
    }
  };

  const autoExpandCategories = (inventoryData) => {
    const expanded = {};

    categories.forEach((category) => {
      const categoryItems = inventoryData.filter(
        (item) => item.products?.category_id === category.id
      );

      const hasUrgent = categoryItems.some((item) => {
        const status = getExpiryStatus(item.expiry_date);
        return (
          status === "critical" || status === "expired" || status === "today"
        );
      });

      expanded[category.id] = hasUrgent;
    });

    setExpandedCategories(expanded);
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
    if (days === 0) return "today";
    if (days <= 5) return "critical";
    if (days <= 10) return "warning";
    return "ok";
  }, []);

  const getEarliestExpiryDate = (categoryId) => {
    const categoryItems = inventory.filter(
      (item) => item.products?.category_id === categoryId
    );

    if (categoryItems.length === 0) return null;

    const dates = categoryItems.map((item) => new Date(item.expiry_date));
    return new Date(Math.min(...dates));
  };

  const getCategoryStatus = useCallback(
    (categoryId) => {
      const categoryItems = inventory.filter(
        (item) => item.products?.category_id === categoryId
      );

      let hasExpired = false;
      let hasToday = false;
      let hasCritical = false;
      let hasWarning = false;

      categoryItems.forEach((item) => {
        const status = getExpiryStatus(item.expiry_date);
        if (status === "expired") hasExpired = true;
        else if (status === "today") hasToday = true;
        else if (status === "critical") hasCritical = true;
        else if (status === "warning") hasWarning = true;
      });

      if (hasExpired || hasToday || hasCritical) return "critical";
      if (hasWarning) return "warning";
      return "ok";
    },
    [inventory, getExpiryStatus]
  );

  const getSortedCategories = () => {
    // Filter categories that have inventory items
    const categoriesWithItems = categories.filter((category) =>
      inventory.some((item) => item.products?.category_id === category.id)
    );

    return categoriesWithItems.sort((a, b) => {
      const statusA = getCategoryStatus(a.id);
      const statusB = getCategoryStatus(b.id);

      const statusPriority = { critical: 0, warning: 1, ok: 2 };
      const priorityA = statusPriority[statusA];
      const priorityB = statusPriority[statusB];

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Same status - sort by earliest expiry date (FIFO)
      const earliestA = getEarliestExpiryDate(a.id);
      const earliestB = getEarliestExpiryDate(b.id);

      if (earliestA && earliestB) {
        return earliestA - earliestB;
      }

      return 0;
    });
  };

  const getInventoryByCategory = (categoryId) => {
    return inventory
      .filter((item) => item.products?.category_id === categoryId)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleModalCategory = (categoryId) => {
    setExpandedModalCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const getFilteredProducts = () => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.categories?.name.toLowerCase().includes(query)
    );
  };

  const getProductsByCategory = (categoryId) => {
    return getFilteredProducts().filter((p) => p.category_id === categoryId);
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
      setSearchQuery("");
      setExpandedModalCategories({});
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

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
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

  const sortedCategories = getSortedCategories();

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

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <h3>Add New Item</h3>

            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="modal-categories">
              {categories.map((category) => {
                const categoryProducts = getProductsByCategory(category.id);
                if (categoryProducts.length === 0) return null;

                return (
                  <div key={category.id} className="modal-category-group">
                    <div
                      className="modal-category-header"
                      onClick={() => toggleModalCategory(category.id)}
                    >
                      <span className="expand-icon">
                        {expandedModalCategories[category.id] ? "▼" : "▶"}
                      </span>
                      <h4>{category.name}</h4>
                      <span className="product-count-small">
                        ({categoryProducts.length})
                      </span>
                    </div>

                    {expandedModalCategories[category.id] && (
                      <div className="modal-products-list">
                        {categoryProducts.map((product) => (
                          <div
                            key={product.id}
                            className={`modal-product-item ${
                              selectedProduct === product.id ? "selected" : ""
                            }`}
                            onClick={() => handleProductSelect(product.id)}
                          >
                            <div className="modal-product-image">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                />
                              ) : (
                                <div className="no-image-small">📦</div>
                              )}
                            </div>
                            <div className="modal-product-name">
                              {product.name}
                            </div>
                            {selectedProduct === product.id && (
                              <div className="checkmark">✓</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddItem} className="modal-form">
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
                  disabled={loading || !selectedProduct}
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
                    setSearchQuery("");
                    setExpandedModalCategories({});
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
        {sortedCategories.map((category) => {
          const categoryItems = getInventoryByCategory(category.id);
          const categoryStatus = getCategoryStatus(category.id);

          return (
            <div key={category.id} className="category-group">
              <div
                className={`category-header ${categoryStatus}`}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="category-title">
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
                                onError={(e) => {
                                  console.error(
                                    "Failed to load image:",
                                    item.products.image_url
                                  );
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML =
                                    '<div class="no-image">📦</div>';
                                }}
                              />
                            ) : (
                              <div className="no-image">📦</div>
                            )}
                          </div>

                          <div className="item-details">
                            <h4>{item.products.name}</h4>
                            {status === "expired" ? (
                              <p className="expiry-text expired-text">
                                <strong>EXPIRED</strong>
                              </p>
                            ) : status === "today" ? (
                              <p className="expiry-text today-text">
                                <strong>EXPIRING TODAY</strong>
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
                </div>
              )}
            </div>
          );
        })}

        {sortedCategories.length === 0 && (
          <div className="empty-state">
            No items in inventory. Add your first item!
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
