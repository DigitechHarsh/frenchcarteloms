import React from 'react';
import { formatINR } from '../../lib/formatters';

interface AdminKpiRowProps {
  totalRevenue: number;
  totalOrders: number;
  totalBowls: number;
}

export const AdminKpiRow: React.FC<AdminKpiRowProps> = ({
  totalRevenue,
  totalOrders,
  totalBowls,
}) => {
  return (
    <div className="fc-admin-kpi-grid">
      {/* 1. Total Revenue */}
      <div className="fc-admin-kpi-card">
        <div className="fc-admin-kpi-header">
          <span className="fc-admin-kpi-label">TOTAL REVENUE</span>
          <span className="fc-admin-kpi-tag">INR Gross</span>
        </div>
        <div className="fc-admin-kpi-value">{formatINR(totalRevenue)}</div>
        <div className="fc-admin-kpi-subtext">
          Gross sales collected across selected timeframe
        </div>
      </div>

      {/* 2. Total Orders */}
      <div className="fc-admin-kpi-card">
        <div className="fc-admin-kpi-header">
          <span className="fc-admin-kpi-label">TOTAL ORDERS</span>
          <span className="fc-admin-kpi-tag">POS Audit</span>
        </div>
        <div className="fc-admin-kpi-value">{totalOrders.toLocaleString()}</div>
        <div className="fc-admin-kpi-subtext">
          Total orders placed and processed
        </div>
      </div>

      {/* 3. Bowls Sold */}
      <div className="fc-admin-kpi-card">
        <div className="fc-admin-kpi-header">
          <span className="fc-admin-kpi-label">BOWLS SOLD</span>
          <span className="fc-admin-kpi-tag">Kitchen Volume</span>
        </div>
        <div className="fc-admin-kpi-value">{totalBowls.toLocaleString()}</div>
        <div className="fc-admin-kpi-subtext">
          Individual loaded french fry bowls prepared
        </div>
      </div>
    </div>
  );
};
