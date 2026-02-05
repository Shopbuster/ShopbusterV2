import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit } from 'lucide-react';

import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

function AdminPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]); 
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingStatus, setEditingStatus] = useState('');
  
  const [storeModal, setStoreModal] = useState({ // Add this
  isOpen: false,
  mode: 'add', // 'add' or 'edit'
  store: null
  });

  const [userModal, setUserModal] = useState({
    isOpen: false,
    user: null
  });

  const [userFormData, setUserFormData] = useState({
    reward_points: 0,
    claimed_rewards: []
  });
  
  const [storeFormData, setStoreFormData] = useState({ // Add this
    name: '',
    logo_url: '',
    timeframe: '2-7 days',
    restriction_1: '',
    restriction_2: '',
    restriction_3: ''
  });

  const { isAdmin } = useAuth();

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('Orders_information')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch all unique users from user_profiles
  const fetchUsers = async () => {
    try {
      // Get all user profiles with their order count in a single query
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          orders:"Orders_information"!user_id(count)
        `);

      if (profileError) throw profileError;

      // Transform the data
      const usersWithOrders = profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        phone: profile.phone,
        created_at: profile.created_at,
        orderCount: profile.orders[0]?.count || 0,
        reward_points: profile.reward_points || 0,
        claimed_rewards: profile.claimed_rewards || []
      }));

      setUsers(usersWithOrders);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  // Fetch all stores
  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStores(data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (activeTab === 'orders') {
        await fetchOrders();
      } else if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'stores') {
        await fetchStores();
      }
      setLoading(false);
    };

    if (isAdmin) {
      fetchData();
    }
  }, [activeTab, isAdmin]);

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      const { error } = await supabase
        .from('Orders_information')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.filter(order => order.id !== orderId));
      alert('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order: ' + error.message);
    }
  };

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('Orders_information')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      setEditingOrderId(null);
      alert('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also delete all their orders.')) return;

    try {
      // First delete all user's orders
      const { error: ordersError } = await supabase
        .from('Orders_information')
        .delete()
        .eq('user_id', userId);

      if (ordersError) throw ordersError;

      // Then delete the user from auth
      const { error: userError } = await supabase.auth.admin.deleteUser(userId);

      if (userError) throw userError;

      setUsers(users.filter(user => user.id !== userId));
      alert('User and their orders deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    }
  };

  const handleOpenStoreModal = (mode, store = null) => {
    setStoreModal({ isOpen: true, mode, store });
    if (mode === 'edit' && store) {
      setStoreFormData({
        name: store.name,
        logo_url: store.logo_url || '',
        timeframe: store.timeframe,
        restriction_1: store.restriction_1 || '',
        restriction_2: store.restriction_2 || '',
        restriction_3: store.restriction_3 || ''
      });
    } else {
      setStoreFormData({
        name: '',
        logo_url: '',
        timeframe: '2-7 days',
        restriction_1: '',
        restriction_2: '',
        restriction_3: ''
      });
    }
  };

  // Close store modal
  const handleCloseStoreModal = () => {
    setStoreModal({ isOpen: false, mode: 'add', store: null });
    setStoreFormData({
      name: '',
      logo_url: '',
      timeframe: '2-7 days',
      restriction_1: '',
      restriction_2: '',
      restriction_3: ''
    });
  };

  // Save store (add or edit)
  const handleSaveStore = async () => {
    if (!storeFormData.name.trim()) {
      alert('Store name is required');
      return;
    }

    try {
      if (storeModal.mode === 'add') {
        // Add new store
        const { error } = await supabase
          .from('stores')
          .insert([storeFormData]);

        if (error) throw error;
        alert('Store added successfully');
      } else {
        // Update existing store
        const { error } = await supabase
          .from('stores')
          .update(storeFormData)
          .eq('id', storeModal.store.id);

        if (error) throw error;
        alert('Store updated successfully');
      }

      await fetchStores();
      handleCloseStoreModal();
    } catch (error) {
      console.error('Error saving store:', error);
      alert('Failed to save store: ' + error.message);
    }
  };

  // Delete store
  const handleDeleteStore = async (storeId) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      setStores(stores.filter(store => store.id !== storeId));
      alert('Store deleted successfully');
    } catch (error) {
      console.error('Error deleting store:', error);
      alert('Failed to delete store: ' + error.message);
    }
  };

  // Toggle store active status
  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: !currentStatus })
        .eq('id', storeId);

      if (error) throw error;

      await fetchStores();
      alert(`Store ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling store status:', error);
      alert('Failed to update store status: ' + error.message);
    }
  };

  const handleOpenUserModal = (user) => {
    setUserModal({ isOpen: true, user });
    setUserFormData({
      reward_points: user.reward_points || 0,
      claimed_rewards: user.claimed_rewards || []
    });
  };

  const handleCloseUserModal = () => {
    setUserModal({ isOpen: false, user: null });
    setUserFormData({ reward_points: 0, claimed_rewards: [] });
  };

  const handleSaveUser = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          reward_points: userFormData.reward_points,
          claimed_rewards: userFormData.claimed_rewards
        })
        .eq('id', userModal.user.id);

      if (error) throw error;

      setUsers(users.map(user =>
        user.id === userModal.user.id
          ? { ...user, reward_points: userFormData.reward_points, claimed_rewards: userFormData.claimed_rewards }
          : user
      ));
      handleCloseUserModal();
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + error.message);
    }
  };

  const handleRewardCheckbox = (rewardId) => {
    setUserFormData(prev => ({
      ...prev,
      claimed_rewards: prev.claimed_rewards.includes(rewardId)
        ? prev.claimed_rewards.filter(id => id !== rewardId)
        : [...prev.claimed_rewards, rewardId]
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Not admin check
  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <button onClick={() => onBack('home')} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="admin-title">Admin Panel</h1>
        </div>
        <div className="admin-container">
          <p>Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <button onClick={() => onBack('home')} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <h1 className="admin-title">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          All Orders ({orders.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          All Users ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          Manage Stores ({stores.length})
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {loading ? (
          <p>Loading...</p>
        ) : activeTab === 'orders' ? (
          // Orders Table
          <div className="admin-table-container">
            {orders.length === 0 ? (
              <p>No orders found</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Referral Code</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.store_name}</td>
                      <td>{order.full_name}</td>
                      <td>{order.store_account_email}</td>
                      <td>{order.phone}</td>
                      <td>{formatCurrency(order.order_amount)}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>
                        {editingOrderId === order.id ? (
                          <select
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(e.target.value)}
                            className="status-select"
                          >
                            <option value="In process">In process</option>
                            <option value="Completed">Completed</option>
                            <option value="Canceled">Canceled</option>
                          </select>
                        ) : (
                          <span className={`status-badge ${order.status?.toLowerCase().replace(' ', '-')}`}>
                            {order.status || 'In process'}
                          </span>
                        )}
                      </td>
                      <td>{order.referral_code || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          {editingOrderId === order.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order.id, editingStatus)}
                                className="save-btn"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingOrderId(null)}
                                className="cancel-btn"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingOrderId(order.id);
                                  setEditingStatus(order.status || 'In process');
                                }}
                                className="edit-btn"
                                title="Edit Status"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="delete-btn"
                                title="Delete Order"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === 'users' ? (
// Users Table
          <div className="admin-table-container">
            {users.length === 0 ? (
              <p>No users found</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Registered</th>
                    <th>Orders</th>
                    <th>Points</th>
                    <th>Rewards</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.name || 'N/A'}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{user.orderCount}</td>
                      <td>{user.reward_points}</td>
                      <td>{user.claimed_rewards?.join(', ') || 'None'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="edit-btn"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="delete-btn"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}  
          </div>
        ) : (
          // Stores Table
          <div className="admin-table-container">
            <button 
              onClick={() => handleOpenStoreModal('add')}
              className="add-store-btn"
            >
              + Add New Store
            </button>
            
            {stores.length === 0 ? (
              <p>No stores found</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Name</th>
                    <th>Timeframe</th>
                    <th>Restrictions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map(store => (
                    <tr key={store.id}>
                      <td>
                        {store.logo_url ? (
                          <img src={store.logo_url} alt={store.name} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                        ) : (
                          'No logo'
                        )}
                      </td>
                      <td>{store.name}</td>
                      <td>{store.timeframe}</td>
                      <td>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                          {store.restriction_1 && <li>{store.restriction_1}</li>}
                          {store.restriction_2 && <li>{store.restriction_2}</li>}
                          {store.restriction_3 && <li>{store.restriction_3}</li>}
                        </ul>
                      </td>
                      <td>
                        <span className={`status-badge ${store.is_active ? 'completed' : 'canceled'}`}>
                          {store.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleOpenStoreModal('edit', store)}
                            className="edit-btn"
                            title="Edit Store"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStoreStatus(store.id, store.is_active)}
                            className={store.is_active ? 'cancel-btn' : 'save-btn'}
                            title={store.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {store.is_active ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            className="delete-btn"
                            title="Delete Store"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Store Modal */}
      {storeModal.isOpen && (
        <div className="modal-overlay" onClick={handleCloseStoreModal}>
          <div className="store-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseStoreModal}>×</button>
            <h2 className="modal-title">
              {storeModal.mode === 'add' ? 'Add New Store' : 'Edit Store'}
            </h2>

            <div className="store-form">
              <div className="form-field">
                <label>Store Name *</label>
                <input
                  type="text"
                  value={storeFormData.name}
                  onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
                  placeholder="e.g., Lululemon"
                />
              </div>

              <div className="form-field">
                <label>Logo URL</label>
                <input
                  type="text"
                  value={storeFormData.logo_url}
                  onChange={(e) => setStoreFormData({ ...storeFormData, logo_url: e.target.value })}
                  placeholder="e.g., /Storeslogo/store.png"
                />
                {storeFormData.logo_url && (
                  <img src={storeFormData.logo_url} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'contain', marginTop: '10px' }} />
                )}
              </div>

              <div className="form-field">
                <label>Timeframe</label>
                <input
                  type="text"
                  value={storeFormData.timeframe}
                  onChange={(e) => setStoreFormData({ ...storeFormData, timeframe: e.target.value })}
                  placeholder="e.g., 2-7 days"
                />
              </div>

              <div className="form-field">
                <label>Restriction 1</label>
                <input
                  type="text"
                  value={storeFormData.restriction_1}
                  onChange={(e) => setStoreFormData({ ...storeFormData, restriction_1: e.target.value })}
                  placeholder="e.g., Order total under 750$"
                />
              </div>

              <div className="form-field">
                <label>Restriction 2</label>
                <input
                  type="text"
                  value={storeFormData.restriction_2}
                  onChange={(e) => setStoreFormData({ ...storeFormData, restriction_2: e.target.value })}
                  placeholder="e.g., Canada and USA only"
                />
              </div>

              <div className="form-field">
                <label>Restriction 3</label>
                <input
                  type="text"
                  value={storeFormData.restriction_3}
                  onChange={(e) => setStoreFormData({ ...storeFormData, restriction_3: e.target.value })}
                  placeholder="e.g., Create a store account"
                />
              </div>

              <button onClick={handleSaveStore} className="save-store-btn">
                {storeModal.mode === 'add' ? 'Add Store' : 'Update Store'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Modal */}
      {userModal.isOpen && (
        <div className="modal-overlay" onClick={handleCloseUserModal}>
          <div className="store-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseUserModal}>×</button>
            <h2 className="modal-title">Edit User Rewards</h2>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>{userModal.user?.email}</p>

            <div className="store-form">
              <div className="form-field">
                <label>Reward Points</label>
                <input
                  type="number"
                  value={userFormData.reward_points}
                  onChange={(e) => setUserFormData({ ...userFormData, reward_points: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="form-field">
                <label>Claimed Rewards</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={userFormData.claimed_rewards.includes(1)}
                      onChange={() => handleRewardCheckbox(1)}
                    />
                    1 - 10% OFF
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={userFormData.claimed_rewards.includes(2)}
                      onChange={() => handleRewardCheckbox(2)}
                    />
                    2 - VIP Store
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={userFormData.claimed_rewards.includes(3)}
                      onChange={() => handleRewardCheckbox(3)}
                    />
                    3 - Free Order
                  </label>
                </div>
              </div>

              <button onClick={handleSaveUser} className="save-store-btn">
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;