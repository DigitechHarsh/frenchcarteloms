import React, { useState, useMemo } from 'react';
import { 
  DatePicker, 
  Button, 
  Segmented, 
  Spin, 
  Divider 
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { apiClient } from '../../lib/supabase';
import type { Order } from '../../types';
import { AdminKpiRow } from './AdminKpiRow';
import { FilterTrendSection } from './FilterTrendSection';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';
import { OrderHistoryTable } from './OrderHistoryTable';
import { OrderDetailDrawer } from './OrderDetailDrawer';

const { RangePicker } = DatePicker;

type QuickRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

export const DashboardPage: React.FC = () => {
  const [quickRange, setQuickRange] = useState<QuickRange>('last30');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(29, 'day').startOf('day'),
    dayjs().endOf('day'),
  ]);

  const [activeFilter, setActiveFilter] = useState<{ label: string; value: string; type: string } | null>(null);
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<Order | null>(null);

  // Fetch all orders
  const { data: allOrders = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['all-dashboard-orders'],
    queryFn: () => apiClient.getOrders(),
    refetchInterval: 10000,
  });

  const handleQuickRangeChange = (val: QuickRange) => {
    setQuickRange(val);
    const now = dayjs();
    if (val === 'today') {
      setDateRange([now.startOf('day'), now.endOf('day')]);
    } else if (val === 'yesterday') {
      const yest = now.subtract(1, 'day');
      setDateRange([yest.startOf('day'), yest.endOf('day')]);
    } else if (val === 'last7') {
      setDateRange([now.subtract(6, 'day').startOf('day'), now.endOf('day')]);
    } else if (val === 'last30') {
      setDateRange([now.subtract(29, 'day').startOf('day'), now.endOf('day')]);
    }
  };

  // Filter orders by date range
  const filteredDateOrders = useMemo(() => {
    const startStr = dateRange[0].format('YYYY-MM-DD');
    const endStr = dateRange[1].format('YYYY-MM-DD');

    return allOrders.filter((o) => o.order_date >= startStr && o.order_date <= endStr);
  }, [allOrders, dateRange]);

  // Top KPIs
  const kpiData = useMemo(() => {
    const nonCancelled = filteredDateOrders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = nonCancelled.reduce((acc, o) => acc + o.total_amount, 0);
    const totalOrders = filteredDateOrders.length;
    const totalBowls = nonCancelled.reduce((acc, o) => acc + (o.items?.length || 0), 0);

    return {
      totalRevenue,
      totalOrders,
      totalBowls,
    };
  }, [filteredDateOrders]);

  const daysCount = useMemo(() => {
    return Math.max(1, dateRange[1].diff(dateRange[0], 'day') + 1);
  }, [dateRange]);

  return (
    <div className="fc-dashboard-wrapper">
      {/* Top Header & Range Filters Toolbar */}
      <div className="fc-dashboard-toolbar">
        <div className="fc-dashboard-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="fc-page-title" style={{ margin: 0 }}>Executive Restaurant Dashboard</h1>
            <span className="fc-dashboard-date-badge">
              {dateRange[0].format('DD MMM YYYY')} – {dateRange[1].format('DD MMM YYYY')} ({daysCount} {daysCount === 1 ? 'day' : 'days'})
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Real-time operations, item sales breakdown, and audit log • {filteredDateOrders.length} orders
          </span>
        </div>

        <div className="fc-dashboard-filters">
          <Segmented<QuickRange>
            value={quickRange}
            onChange={(val) => handleQuickRangeChange(val)}
            size="middle"
            options={[
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: '7 Days', value: 'last7' },
              { label: '30 Days', value: 'last30' },
              ...(quickRange === 'custom' ? [{ label: 'Custom', value: 'custom' as QuickRange }] : []),
            ]}
          />

          <RangePicker
            value={dateRange}
            format="DD MMM YYYY"
            allowClear={false}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
                setQuickRange('custom');
              }
            }}
            size="middle"
            style={{ width: 250 }}
            presets={[
              { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
              { label: 'Yesterday', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
              { label: 'Last 7 Days', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
              { label: 'Last 30 Days', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
              { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
            ]}
          />

          <Button
            size="middle"
            onClick={() => refetch()}
            loading={isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="fc-loading-container">
          <Spin size="large" tip="Loading Analytics..." />
        </div>
      ) : (
        <div className="fc-admin-layout">
          {/* 1. Top KPI Summary Cards: Total Revenue, Total Orders, Bowls Sold */}
          <AdminKpiRow
            totalRevenue={kpiData.totalRevenue}
            totalOrders={kpiData.totalOrders}
            totalBowls={kpiData.totalBowls}
          />

          {/* 2. Filter Bar (Bowl size & 4 Flavors + Addons) + Dynamic Graph + Highest Flavor Bowl Sold Table */}
          <FilterTrendSection
            orders={filteredDateOrders}
            dateRange={dateRange}
          />

          {/* 3. Three Key Vertical & Pie Charts:
              - Vertical Bar Graph: Flavors sold with bowl size breakdown
              - Vertical Bar Graph: Add-on toppings volume
              - Pie Chart: Payment settlement methods
          */}
          <AdminAnalyticsCharts orders={filteredDateOrders} />

          <Divider style={{ margin: '12px 0' }} />

          {/* 4. Order History Audit Log (Without Chef Column) */}
          <div className="fc-dashboard-table-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--primary-burgundy)' }}>
                  Order History Audit Log ({filteredDateOrders.length} orders)
                </h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Click any row to open the complete timeline drawer and print receipt
                </span>
              </div>
            </div>

            <OrderHistoryTable
              orders={filteredDateOrders}
              onRowClick={(order) => setSelectedDrawerOrder(order)}
              activeFilter={activeFilter}
              onClearFilter={() => setActiveFilter(null)}
            />
          </div>
        </div>
      )}

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedDrawerOrder}
        open={Boolean(selectedDrawerOrder)}
        onClose={() => setSelectedDrawerOrder(null)}
      />
    </div>
  );
};
