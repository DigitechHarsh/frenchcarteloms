import React from 'react';
import { Card, Button, Tag, Divider, Tooltip } from 'antd';
import { 
  ThunderboltFilled, 
  ArrowUpOutlined, 
  CheckCircleFilled, 
  FireFilled,
  ClockCircleFilled,
  RightOutlined
} from '@ant-design/icons';
import { formatINR, formatKolkataTime } from '../../lib/formatters';
import type { Order } from '../../types';

interface LiveActivityPanelProps {
  todayRevenue: number;
  todayOrdersCount: number;
  activeKitchenCount: number;
  recentOrders: Order[];
  onOpenOrder: (order: Order) => void;
}

export const LiveActivityPanel: React.FC<LiveActivityPanelProps> = ({
  todayRevenue,
  todayOrdersCount,
  activeKitchenCount,
  recentOrders,
  onOpenOrder,
}) => {
  return (
    <aside className="fc-riday-right-panel">
      {/* 1. Total Sale Widget */}
      <div className="fc-riday-side-widget">
        <span className="fc-riday-side-label">Today's Total Sale</span>
        <div className="fc-riday-side-val-row">
          <span className="fc-riday-side-val">{formatINR(todayRevenue)}</span>
          {/* Mini Sparkline Green Wave */}
          <svg width="74" height="32" viewBox="0 0 100 35">
            <defs>
              <linearGradient id="greenWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#52C41A" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#52C41A" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,28 Q25,5 50,20 T100,8 L100,35 L0,35 Z"
              fill="url(#greenWave)"
            />
            <path
              d="M0,28 Q25,5 50,20 T100,8"
              fill="none"
              stroke="#52C41A"
              strokeWidth="3"
            />
          </svg>
        </div>

        <div className="fc-riday-side-subline">
          <span>{todayOrdersCount} total orders today</span>
          <span className="fc-riday-link">Live View</span>
        </div>
      </div>

      {/* 2. Active Kitchen Queue Widget */}
      <div className="fc-riday-side-widget" style={{ marginTop: 14 }}>
        <span className="fc-riday-side-label">Active Kitchen Queue</span>
        <div className="fc-riday-side-val-row">
          <span className="fc-riday-side-val" style={{ color: '#FA8C16' }}>
            {activeKitchenCount} Orders
          </span>
          {/* Mini Blue Sparkline */}
          <svg width="74" height="32" viewBox="0 0 100 35">
            <defs>
              <linearGradient id="blueWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1890FF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1890FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,24 Q20,30 45,15 T100,6 L100,35 L0,35 Z"
              fill="url(#blueWave)"
            />
            <path
              d="M0,24 Q20,30 45,15 T100,6"
              fill="none"
              stroke="#1890FF"
              strokeWidth="3"
            />
          </svg>
        </div>

        <div className="fc-riday-pill-buttons">
          <span className="fc-side-pill live">● LIVE</span>
          <span className="fc-side-pill info">Chef 1 & 2</span>
          <span className="fc-side-pill action">Queue Active</span>
        </div>
      </div>

      {/* 3. Customer Repeat Rate */}
      <div className="fc-riday-side-widget" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="fc-riday-side-label">Customer Repeat Rate</span>
          <span style={{ fontSize: 11, color: '#8C8C8C' }}>Kolkata Truck</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '8px 0 6px' }}>
          <span className="fc-riday-side-val" style={{ fontSize: 24 }}>68.4%</span>
          {/* Mini Coral Wave */}
          <svg width="74" height="28" viewBox="0 0 100 35">
            <defs>
              <linearGradient id="coralWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FA541C" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FA541C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,22 Q30,4 60,18 T100,10 L100,35 L0,35 Z"
              fill="url(#coralWave)"
            />
            <path
              d="M0,22 Q30,4 60,18 T100,10"
              fill="none"
              stroke="#FA541C"
              strokeWidth="3"
            />
          </svg>
        </div>

        <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700 }}>
          <span style={{ color: '#1890FF' }}>● First Time (31.6%)</span>
          <span style={{ color: '#FA541C' }}>● Returning (68.4%)</span>
        </div>
      </div>

      {/* 4. Recent Activity Stream */}
      <div className="fc-riday-activity-section" style={{ marginTop: 20 }}>
        <div className="fc-riday-activity-header">
          <span className="fc-riday-activity-title">Recent Activity</span>
          <span style={{ fontSize: 11, color: '#8C8C8C' }}>Realtime</span>
        </div>

        <div className="fc-riday-timeline">
          {recentOrders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="fc-riday-activity-item"
              onClick={() => onOpenOrder(order)}
            >
              <div className="fc-riday-activity-time">
                {formatKolkataTime(order.created_at)}
              </div>
              <div className="fc-riday-activity-dot" />
              <div className="fc-riday-activity-body">
                <span className="fc-riday-activity-text">
                  <b>Token #{order.token_number}</b> ({order.customer_name || 'Walk-in'}) -{' '}
                  <span style={{ color: '#E65100', fontWeight: 700 }}>
                    {formatINR(order.total_amount)}
                  </span>
                </span>
                <span className="fc-riday-activity-sub">
                  {order.items?.map((it) => it.flavor_name).join(', ')} • {order.assigned_chef || 'Chef 1'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
