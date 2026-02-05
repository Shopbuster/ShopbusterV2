import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
const WEEK_START = new Date('2025-02-01T00:00:00Z');

function getWeekLabel(date) {
  const d = new Date(date);
  const diff = Math.floor((d - WEEK_START) / (7 * 24 * 60 * 60 * 1000));
  const weekStart = new Date(WEEK_START.getTime() + diff * 7 * 24 * 60 * 60 * 1000);
  const month = weekStart.toLocaleString('en-US', { month: 'short' });
  const day = weekStart.getDate();
  return `${month} ${day}`;
}

function getWeekIndex(date) {
  const d = new Date(date);
  return Math.floor((d - WEEK_START) / (7 * 24 * 60 * 60 * 1000));
}

function aggregateByWeek(orders) {
  const map = {};
  orders.forEach(o => {
    const idx = getWeekIndex(o.created_at);
    const label = getWeekLabel(o.created_at);
    if (!map[idx]) map[idx] = { label, sales: 0, earnings: 0, potentialSales: 0, potentialEarnings: 0 };
    
    if (o.status === 'Completed') {
      map[idx].sales += 1;
      map[idx].earnings += o.order_amount * 0.3;
    } else if (o.status === 'In process') {
      map[idx].potentialSales += 1;
      map[idx].potentialEarnings += o.order_amount * 0.3;
    }
  });
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
  return keys.map(k => map[k]);
}

function formatCurrency(n) {
  return '$' + n.toFixed(2);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Compute nice Y-axis ticks that adapt to the data ────────────────────────
function getNiceTicks(maxVal, tickCount = 5, forceInteger = false) {
  if (maxVal <= 0) return [0];
  
  // For small integer values (like sales count), use simple integer ticks
  if (forceInteger && maxVal <= 10) {
    const step = maxVal <= 5 ? 1 : 2;
    const ticks = [];
    for (let v = 0; v <= maxVal; v += step) {
      ticks.push(v);
    }
    if (ticks[ticks.length - 1] < maxVal) {
      ticks.push(ticks[ticks.length - 1] + step);
    }
    return ticks;
  }
  
  const rawStep = maxVal / (tickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceStep;
  if (residual <= 1)       niceStep = 1 * magnitude;
  else if (residual <= 2)  niceStep = 2 * magnitude;
  else if (residual <= 5)  niceStep = 5 * magnitude;
  else                     niceStep = 10 * magnitude;
  
  // Force integer steps if needed
  if (forceInteger) niceStep = Math.max(1, Math.ceil(niceStep));
  
  const niceMax = Math.ceil(maxVal / niceStep) * niceStep;
  const ticks = [];
  for (let v = 0; v <= niceMax; v += niceStep) {
    ticks.push(parseFloat(v.toFixed(10)));
  }
  return ticks;
}

function formatTickLabel(value, isEarnings) {
  if (isEarnings) {
    if (value >= 1000) return '$' + (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1) + 'k';
    return '$' + value.toFixed(value === Math.floor(value) ? 0 : 2);
  }
  return String(value);
}

// ── Mini Bar Chart (pure CSS / inline SVG) with adaptive Y axis ─────────────
function BarChart({ data, dataKey, color, accentColor }) {
  const [tooltip, setTooltip] = useState(null);
  
  if (!data.length) return null;

  const isEarnings = dataKey === 'earnings';
  const potentialKey = isEarnings ? 'potentialEarnings' : 'potentialSales';
  
  // Max should consider both confirmed and potential
  const rawMax = Math.max(
    ...data.map(d => d[dataKey]),
    ...data.map(d => d[potentialKey]),
    1
  );
  const ticks = getNiceTicks(rawMax, 5, !isEarnings);
  const niceMax = ticks[ticks.length - 1];

  const yAxisWidth = 62;
  const topPadding = 16;
  const chartHeight = 190;
  const bottomPadding = 28;
  const barWidth = Math.max(12, Math.min(32, 400 / data.length - 14));
  const barGap = 6;
  const groupGap = 16;
  const groupWidth = barWidth * 2 + barGap;
  const barsAreaWidth = data.length * (groupWidth + groupGap) + groupGap;
  const svgWidth = Math.max(yAxisWidth + barsAreaWidth + 10, 320);
  const svgHeight = topPadding + chartHeight + bottomPadding;

  return (
    <div className="sd-chart-scroll">
      <svg width={svgWidth} height={svgHeight} className="sd-chart-svg">
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`grad-${dataKey}-potential`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Y-axis ticks + gridlines */}
        {ticks.map((tick, i) => {
          const y = topPadding + chartHeight - (tick / niceMax) * chartHeight;
          return (
            <g key={`tick-${i}`}>
              <line
                x1={yAxisWidth - 4}
                x2={svgWidth}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4 4"
              />
              <text
                x={yAxisWidth - 10}
                y={y + 5}
                textAnchor="end"
                dominantBaseline="middle"
                className="sd-axis-label"
              >
                {formatTickLabel(tick, isEarnings)}
              </text>
            </g>
          );
        })}

        {/* Y-axis line */}
        <line
          x1={yAxisWidth}
          x2={yAxisWidth}
          y1={topPadding}
          y2={topPadding + chartHeight}
          stroke="rgba(255,255,255,0.08)"
        />

        {/* Bars */}
        {data.map((d, i) => {
          const groupX = yAxisWidth + i * (groupWidth + groupGap) + groupGap;
          
          // Confirmed bar
          const hConfirmed = (d[dataKey] / niceMax) * chartHeight;
          const xConfirmed = groupX;
          const yConfirmed = topPadding + chartHeight - hConfirmed;
          
          // Potential bar
          const hPotential = (d[potentialKey] / niceMax) * chartHeight;
          const xPotential = groupX + barWidth + barGap;
          const yPotential = topPadding + chartHeight - hPotential;
          
          return (
            <g key={i}>
              {/* Confirmed bar */}
              <rect
                x={xConfirmed}
                y={yConfirmed}
                width={barWidth}
                height={Math.max(hConfirmed, 0)}
                rx={4}
                fill={`url(#grad-${dataKey})`}
                className="sd-bar"
                onMouseEnter={() => setTooltip({ 
                  x: xConfirmed + barWidth / 2, 
                  y: yConfirmed - 10, 
                  value: d[dataKey], 
                  label: d.label,
                  type: 'Confirmed'
                })}
                onMouseLeave={() => setTooltip(null)}
              />
              
              {/* Potential bar */}
              <rect
                x={xPotential}
                y={yPotential}
                width={barWidth}
                height={Math.max(hPotential, 0)}
                rx={4}
                fill={`url(#grad-${dataKey}-potential)`}
                stroke={color}
                strokeOpacity="0.3"
                strokeWidth="1"
                strokeDasharray="3 2"
                className="sd-bar"
                onMouseEnter={() => setTooltip({ 
                  x: xPotential + barWidth / 2, 
                  y: yPotential - 10, 
                  value: d[potentialKey], 
                  label: d.label,
                  type: 'Potential'
                })}
                onMouseLeave={() => setTooltip(null)}
              />
              
              {/* Week label */}
              <text
                x={groupX + groupWidth / 2}
                y={topPadding + chartHeight + 16}
                textAnchor="middle"
                className="sd-chart-label"
              >
                {d.label}
              </text>
            </g>
          );
        })}
        
        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 60}
              y={Math.max(tooltip.y - 28, 4)}
              width={120}
              height={24}
              rx={6}
              fill="rgba(17,17,24,0.92)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
            <text
              x={tooltip.x}
              y={Math.max(tooltip.y - 12, 20)}
              textAnchor="middle"
              className="sd-tooltip-text"
            >
              {tooltip.type}: {isEarnings ? formatCurrency(tooltip.value) : tooltip.value}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
function SellerDashboard({ onBack }) {
  const { user, sellerReferralCode } = useAuth();
  const [chartView, setChartView] = useState('sales'); // 'sales' | 'earnings'
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from Supabase matching the seller's referral code
  useEffect(() => {
    const fetchOrders = async () => {
      console.log('Fetching orders for referral code:', sellerReferralCode)
      
      if (!user || !sellerReferralCode) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('Orders_information')
          .select('*')
          .eq('referral_code', sellerReferralCode)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedOrders = data.map((order) => ({
          id: order.id,
          store_name: order.store_name,
          order_amount: order.order_amount,
          created_at: order.created_at,
          status: order.status || 'In process',
        }));

        setOrders(transformedOrders);
      } catch (error) {
        console.error('Error fetching seller orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, sellerReferralCode]);

  const weeklyData = useMemo(() => aggregateByWeek(orders), [orders]);

  const completedOrders = orders.filter(o => o.status === 'Completed');
  const pendingOrders = orders.filter(o => o.status === 'In process').length;

  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.order_amount * 0.3, 0);
  // Get the most recent completed order date
  const lastSaleDate = completedOrders.length > 0
    ? completedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at
    : null;

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const sortedOrders = [...filteredOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In process': return 'status-in-process';
      case 'Canceled': return 'status-canceled';
      default: return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="sd-page">
        <div className="sd-header">
          <button onClick={() => onBack('home')} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="sd-title">Seller Dashboard</h1>
        </div>
        <div className="sd-empty">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Not a seller or not logged in
  if (!user || !sellerReferralCode) {
    return (
      <div className="sd-page">
        <div className="sd-header">
          <button onClick={() => onBack('home')} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="sd-title">Seller Dashboard</h1>
        </div>
        <div className="sd-empty">
          <p>Please log in as a seller to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-page">
      {/* Header */}
      <div className="sd-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button onClick={() => onBack('home')} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="sd-title">Seller Dashboard</h1>
          <p className="sd-subtitle">Track your performance and manage orders</p>
        </div>
        <div className="sd-referral-badge">
          <span className="sd-referral-label">Referral Code</span>
          <span className="sd-referral-code">{sellerReferralCode}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="sd-kpi-grid">
        <div className="sd-kpi-card sd-kpi-sales">
          <div className="sd-kpi-icon-wrap sd-kpi-icon-blue">
            <ShoppingBag size={20} />
          </div>
          <div className="sd-kpi-content">
            <span className="sd-kpi-label">Last Sale</span>
            <span className="sd-kpi-value sd-kpi-value-date">
              {lastSaleDate ? formatDate(lastSaleDate) : 'No sales yet'}
            </span>
          </div>
        </div>

        <div className="sd-kpi-card sd-kpi-earnings">
          <div className="sd-kpi-icon-wrap sd-kpi-icon-green">
            <DollarSign size={20} />
          </div>
          <div className="sd-kpi-content">
            <span className="sd-kpi-label">Total Earnings</span>
            <span className="sd-kpi-value">{formatCurrency(totalEarnings)}</span>
          </div>
        </div>

        <div className="sd-kpi-card sd-kpi-pending">
          <div className="sd-kpi-icon-wrap sd-kpi-icon-amber">
            <Clock size={20} />
          </div>
          <div className="sd-kpi-content">
            <span className="sd-kpi-label">Pending</span>
            <span className="sd-kpi-value">{pendingOrders}</span>
          </div>
        </div>

        <div className="sd-kpi-card sd-kpi-completed">
          <div className="sd-kpi-icon-wrap sd-kpi-icon-emerald">
            <TrendingUp size={20} />
          </div>
          <div className="sd-kpi-content">
            <span className="sd-kpi-label">Completed</span>
            <span className="sd-kpi-value">{completedOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="sd-chart-section">
        <div className="sd-chart-header">
          <h2 className="sd-section-title">
            {chartView === 'sales' ? 'Weekly Sales' : 'Weekly Earnings'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="sd-legend">
              <span className="sd-legend-dot sd-legend-confirmed"></span>
              <span className="sd-legend-text">Confirmed</span>
              <span className="sd-legend-dot sd-legend-potential"></span>
              <span className="sd-legend-text">Potential</span>
            </div>
          
          <div className="sd-toggle-wrap">
            <button
              className={`sd-toggle-btn ${chartView === 'sales' ? 'sd-toggle-active' : ''}`}
              onClick={() => setChartView('sales')}
            >
              Sales
            </button>
            <button
              className={`sd-toggle-btn ${chartView === 'earnings' ? 'sd-toggle-active' : ''}`}
              onClick={() => setChartView('earnings')}
            >
              Earnings
            </button>
          </div>
        </div>
      </div>

        <div className="sd-chart-body">
          {chartView === 'sales' ? (
            <BarChart data={weeklyData} dataKey="sales" color="#6366f1" accentColor="#818cf8" />
          ) : (
            <BarChart data={weeklyData} dataKey="earnings" color="#10b981" accentColor="#34d399" />
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="sd-orders-section">
        <div className="sd-orders-header">
          <h2 className="sd-section-title">Recent Orders</h2>
        </div>

        <div className="sd-filters">
          {['all', 'Completed', 'In process', 'Canceled'].map((status) => (
            <button
              key={status}
              className={`sd-filter-btn ${filterStatus === status ? 'sd-filter-active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>

        {sortedOrders.length === 0 ? (
          <div className="sd-empty">
            <p>No orders match this filter.</p>
          </div>
        ) : (
          <div className="sd-table-wrap">
            <table className="sd-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Order Amount</th>
                  <th>Date</th>
                  <th>Your Earnings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) => (
                  <tr key={order.id} className="sd-row">
                    <td className="sd-cell-store">{order.store_name}</td>
                    <td>{formatCurrency(order.order_amount)}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td className="sd-cell-due">{formatCurrency(order.order_amount * 0.3)}</td>
                    <td>
                      <span className={`sd-status ${getStatusClass(order.status)}`}>
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
    </div>
  );
}

export default SellerDashboard;