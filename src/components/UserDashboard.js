import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./UserDashboard.css";

function UserDashboard() {
  const [shop, setShop] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
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
  }, []);

  useEffect(() => {
    if (shop) {
      fetchInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  const fetchShop = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("shops")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) setShop(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("name");

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
          image_url
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

  const getExpiryStatus = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return "expired";
    if (days <= 5) return "critical";
    if (days <= 10) return "warning";
    return "ok";
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

  if (!shop) return <div className="loading">Loading...</div>;

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
                      {product.name}
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

      <div className="inventory-list">
        {inventory.length === 0 ? (
          <div className="empty-state">
            No items in inventory. Add your first item!
          </div>
        ) : (
          inventory.map((item) => {
            const status = getExpiryStatus(item.expiry_date);

            return (
              <div key={item.id} className={`inventory-item ${status}`}>
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
                  <h3>{item.products.name}</h3>
                  {status === "expired" ? (
                    <p className="expiry-text expired-text">
                      <strong>EXPIRED</strong>
                    </p>
                  ) : (
                    <p className="expiry-text">
                      Expires: {new Date(item.expiry_date).toLocaleDateString()}
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
          })
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
