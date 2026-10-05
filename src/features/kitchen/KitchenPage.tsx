import React, { useState, useEffect, useMemo } from 'react';
import { 
  Button, 
  Tag, 
  Input, 
  Segmented, 
  message, 
  notification, 
  Switch 
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient, subscribeToOrders } from '../../lib/supabase';
import { soundManager } from '../../lib/sound';
import { useSettingsStore } from '../../store/useSettingsStore';
import { getKolkataDateString, formatKolkataTime } from '../../lib/formatters';
import type { Order } from '../../types';

export const KitchenPage: React.FC = () => {
  const queryClient = useQueryClient();
  const todayStr = getKolkataDateString();
  const { settings, updateSettings } = useSettingsStore();

  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch today's orders
  const { data: orders = [] } = useQuery({
    queryKey: ['kitchen-orders', todayStr],
    queryFn: () => apiClient.getOrders(todayStr),
    refetchInterval: 5000,
  });

  // Sound alerts on incoming order
  useEffect(() => {
    const unsubscribe = subscribeToOrders((payload) => {
      if (payload.eventType === 'INSERT') {
        if (settings.sound_alerts_enabled) {
          soundManager.playNewOrderSound();
        }
        notification.info({
          message: `New Order #${payload.new.token_number} Received`,
          description: `${payload.new.customer_name || 'Walk-in'} • Priority #${payload.new.token_number} in kitchen queue.`,
          placement: 'topRight',
          duration: 4,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    });

    return () => unsubscribe();
  }, [queryClient, settings.sound_alerts_enabled]);

  // Status transition mutation (Mark Ready -> Complete flow)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      await apiClient.updateOrderStatus(orderId, status);
    },
    onSuccess: (_, variables) => {
      if (variables.status === 'ready' && settings.sound_alerts_enabled) {
        soundManager.playOrderReadySound();
      }
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    },
  });

  // Cancel order mutation with undo toast
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiClient.updateOrderStatus(orderId, 'cancelled');
    },
    onSuccess: (_, orderId) => {
      const key = `undo-cancel-${orderId}`;
      notification.warning({
        key,
        message: 'Order Cancelled',
        description: 'Order removed from kitchen table.',
        duration: 5,
        btn: (
          <Button
            type="primary"
            size="small"
            onClick={async () => {
              await apiClient.updateOrderStatus(orderId, 'new');
              notification.destroy(key);
              message.success('Order restored.');
              queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
            }}
          >
            Undo (5s)
          </Button>
        ),
      });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    },
  });

  // Calculate Batch Prep Summary (Active bowls to cook right now)
  const batchSummary = useMemo(() => {
    const activeCookingOrders = orders.filter((o) => o.status === 'new' || o.status === 'preparing');
    const counts: Record<string, number> = {};

    activeCookingOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const key = `[${item.size_code}] ${item.flavor_name}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [orders]);

  const totalActiveBowls = useMemo(() => {
    return batchSummary.reduce((acc, item) => acc + item.count, 0);
  }, [batchSummary]);

  // Counts for KPI summary
  const inPrepCount = useMemo(
    () => orders.filter((o) => o.status === 'new' || o.status === 'preparing').length,
    [orders]
  );
  const readyCount = useMemo(() => orders.filter((o) => o.status === 'ready').length, [orders]);
  const completedCount = useMemo(() => orders.filter((o) => o.status === 'completed').length, [orders]);
  const activeCount = useMemo(() => inPrepCount + readyCount, [inPrepCount, readyCount]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter according to completion steps
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? order.status === 'new' || order.status === 'preparing' || order.status === 'ready'
          : statusFilter === 'in_prep'
          ? order.status === 'new' || order.status === 'preparing'
          : order.status === statusFilter;

      // 2. Search Query Filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.token_number.toString().includes(q) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
        order.items?.some(
          (it) =>
            it.flavor_name.toLowerCase().includes(q) ||
            it.size_name.toLowerCase().includes(q) ||
            (it.free_topping && it.free_topping.toLowerCase().includes(q)) ||
            it.toppings?.some((t) => t.topping_name.toLowerCase().includes(q))
        );

      return matchesStatus && matchesSearch;
    }).sort((a, b) => a.token_number - b.token_number || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="fc-kitchen-wrapper">
      {/* 1. KITCHEN TOOLBAR & KPI HEADER */}
      <header className="fc-kitchen-header-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--primary-burgundy)', letterSpacing: -0.4 }}>
              Kitchen Orders Wall
            </h1>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Active Orders: <b>{activeCount}</b> | In Prep: <b>{inPrepCount}</b> | Ready: <b>{readyCount}</b> | Completed: <b>{completedCount}</b>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Audio Alerts:</span>
            <Switch
              size="small"
              checked={settings.sound_alerts_enabled}
              onChange={(checked) => updateSettings({ sound_alerts_enabled: checked })}
            />
          </div>
        </div>

        {/* Filters & Search Facility */}
        <div className="fc-kitchen-filter-row">
          <Segmented
            options={[
              { label: `All Active (${activeCount})`, value: 'active' },
              { label: `1. In Prep (${inPrepCount})`, value: 'in_prep' },
              { label: `2. Ready (${readyCount})`, value: 'ready' },
              { label: `3. Completed (${completedCount})`, value: 'completed' },
              { label: `All (${orders.length})`, value: 'all' },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as string)}
            block
          />

          <Input
            placeholder="Search token #, customer name, or bowl flavor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </div>
      </header>

      {/* 2. BATCH COOKING SUMMARY BANNER */}
      {totalActiveBowls > 0 && (
        <section className="fc-kitchen-batch-bar">
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-burgundy)', marginRight: 6 }}>
            Live Prep Summary ({totalActiveBowls} Bowls):
          </span>
          {batchSummary.map((item, idx) => (
            <Tag
              key={idx}
              style={{
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 12,
                padding: '3px 8px',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-card)',
                color: 'var(--text-dark)',
              }}
            >
              <b>{item.count}x</b> {item.name}
            </Tag>
          ))}
        </section>
      )}

      {/* 3. TABULAR DATA GRID (ROW-COLUMN FORMAT) */}
      <section className="fc-kitchen-table-wrap">
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No matching orders found in the kitchen queue.
          </div>
        ) : (
          <table className="fc-kitchen-table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Priority #</th>
                <th style={{ width: 150 }}>Customer</th>
                <th>Bowls & Customizations</th>
                <th style={{ width: 130 }}>Elapsed Time</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 160, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const elapsedMins = Math.max(1, dayjs().diff(dayjs(order.created_at), 'minute'));
                const isReady = order.status === 'ready';
                const isCompleted = order.status === 'completed';
                const isInPrep = order.status === 'new' || order.status === 'preparing';

                // SLA Timing classification
                const isAmber = elapsedMins >= 8 && elapsedMins < 15;
                const isRed = elapsedMins >= 15;

                return (
                  <tr key={order.id}>
                    {/* Token / Priority */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="fc-kitchen-token">#{order.token_number}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatKolkataTime(order.created_at)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                        {order.customer_name || <i>Walk-in</i>}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {order.items?.length || 0} Bowl{(order.items?.length || 0) > 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Bowls & Customizations */}
                    <td>
                      {order.items?.map((item, idx) => {
                        const toppingsText = [
                          item.free_topping && item.free_topping !== 'None' ? `${item.free_topping} (Free)` : null,
                          ...(item.toppings?.map((t) => t.topping_name) || []),
                        ]
                          .filter(Boolean)
                          .join(', ');

                        return (
                          <div key={idx} className="fc-kitchen-bowl-item">
                            <span style={{ fontWeight: 700 }}>
                              [{item.size_code}] {item.flavor_name}
                            </span>
                            {toppingsText && (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6 }}>
                                • {toppingsText}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {order.notes && (
                        <div style={{ color: '#D97706', fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>
                          Note: {order.notes}
                        </div>
                      )}
                    </td>

                    {/* Elapsed Time & SLA */}
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {elapsedMins} min{elapsedMins > 1 ? 's' : ''}
                      </div>
                      <Tag
                        color={isRed ? 'error' : isAmber ? 'warning' : 'success'}
                        style={{ margin: 0, fontSize: 10, fontWeight: 700 }}
                      >
                        {isRed ? 'Overdue (>15m)' : isAmber ? 'Delayed (8-15m)' : 'On Time (<8m)'}
                      </Tag>
                    </td>

                    {/* Status */}
                    <td>
                      <Tag
                        color={
                          isCompleted
                            ? 'default'
                            : isReady
                            ? 'green'
                            : isInPrep
                            ? 'purple'
                            : 'gold'
                        }
                        style={{ fontWeight: 800, fontSize: 11, margin: 0 }}
                      >
                        {isReady ? 'READY' : isCompleted ? 'COMPLETED' : 'IN PREP'}
                      </Tag>
                    </td>

                    {/* Direct Flow Action Buttons: Mark Ready -> Complete */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {isInPrep && (
                          <Button
                            type="primary"
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
                            style={{
                              background: '#15803D',
                              borderColor: '#15803D',
                              fontWeight: 700,
                              fontSize: 12,
                              borderRadius: 6,
                            }}
                          >
                            Mark Ready
                          </Button>
                        )}

                        {isReady && (
                          <Button
                            type="primary"
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'completed' })}
                            style={{
                              background: 'var(--primary-burgundy)',
                              borderColor: 'var(--primary-burgundy)',
                              fontWeight: 700,
                              fontSize: 12,
                              borderRadius: 6,
                            }}
                          >
                            Complete
                          </Button>
                        )}

                        {isCompleted && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Delivered</span>
                        )}

                        {!isCompleted && (
                          <Button
                            size="small"
                            type="link"
                            danger
                            onClick={() => cancelOrderMutation.mutate(order.id)}
                            style={{ fontSize: 11, padding: 0, marginLeft: 4 }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default KitchenPage;
