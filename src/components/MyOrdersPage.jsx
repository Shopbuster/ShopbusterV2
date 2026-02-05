import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

function MyOrdersPage({ onBack }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('Orders_information')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to match the component's expected format
        const transformedOrders = data.map((order, index) => ({
          id: order.id,
          store: order.store_name,
          orderAmount: order.order_amount,
          date: order.created_at,
          status: order.status || 'In process' // Default status if not set
        }));

        setOrders(transformedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Filter orders by status
  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  // Sort by date (most recent first)
  const sortedOrders = [...filteredOrders].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  // Calculate amount due (50% of order amount)
  const calculateAmountDue = (orderAmount) => {
    return orderAmount * 0.5;
  };

  // Get status class for styling
  const getStatusClass = (status) => {
    switch(status) {
      case 'Completed':
        return 'status-completed';
      case 'In process':
        return 'status-in-process';
      case 'Canceled':
        return 'status-canceled';
      default:
        return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="orders-header">
          <button onClick={() => onBack('home')} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="orders-title">My Orders</h1>
        </div>
        <div className="empty-state">
          <p className="empty-text">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="my-orders-page">
        <div className="orders-header">
          <button onClick={() => onBack('home')} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="orders-title">My Orders</h1>
        </div>
        <div className="empty-state">
          <p className="empty-text">Please log in to view your orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="orders-header">
        <button onClick={() => onBack('home')} className="back-button">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <h1 className="orders-title">My Orders</h1>
      </div>

      {/* Filter Buttons */}
      <div className="orders-filters">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'filter-active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filterStatus === 'Completed' ? 'filter-active' : ''}`}
          onClick={() => setFilterStatus('Completed')}
        >
          Completed
        </button>
        <button
          className={`filter-btn ${filterStatus === 'In process' ? 'filter-active' : ''}`}
          onClick={() => setFilterStatus('In process')}
        >
          In Process
        </button>
        <button
          className={`filter-btn ${filterStatus === 'Canceled' ? 'filter-active' : ''}`}
          onClick={() => setFilterStatus('Canceled')}
        >
          Canceled
        </button>
      </div>

      {/* Orders Table or Empty State */}
      {sortedOrders.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">Nothing there yet :)</p>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Order Amount</th>
                <th>Date</th>
                <th>Amount Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map(order => (
                <tr key={order.id} className="order-row">
                  <td className="order-store">{order.store}</td>
                  <td className="order-amount">{formatCurrency(order.orderAmount)}</td>
                  <td className="order-date">{formatDate(order.date)}</td>
                  <td className="order-due">{formatCurrency(calculateAmountDue(order.orderAmount))}</td>
                  <td>
                    <span className={`order-status ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyOrdersPage;