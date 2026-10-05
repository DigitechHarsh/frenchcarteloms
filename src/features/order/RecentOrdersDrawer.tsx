import React from 'react';
import { Drawer, Tag, Empty } from 'antd';
import { HistoryOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { Order } from '../../types';
import { formatINR, formatKolkataTime } from '../../lib/formatters';

interface RecentOrdersDrawerProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
}

const statusTags: Record<Order['status'], { color: string; label: string }> = {
  new: { color: 'blue', label: 'NEW' },
  preparing: { color: 'orange', label: 'PREPARING' },
  ready: { color: 'green', label: 'READY' },
  completed: { color: 'default', label: 'COMPLETED' },
  cancelled: { color: 'red', label: 'CANCELLED' },
};

export const RecentOrdersDrawer: React.FC<RecentOrdersDrawerProps> = ({
  open,
  onClose,
  orders,
}) => {
  const recent10 = orders.slice(0, 10);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HistoryOutlined style={{ color: '#E65100' }} />
          <span>Recent Orders (Last 10)</span>
        </div>
      }
      placement="right"
      width={380}
      onClose={onClose}
      open={open}
    >
      {recent10.length === 0 ? (
        <Empty description="No orders placed yet today" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recent10.map((order) => {
            const st = statusTags[order.status] || { color: 'default', label: order.status };
            return (
              <div key={order.id} className="fc-drawer-order-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="fc-drawer-token">#{order.token_number}</span>
                  <Tag color={st.color} style={{ fontWeight: 700 }}>
                    {st.label}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13 }}>
                  <span>{order.customer_name || 'Walk-in'}</span>
                  <span style={{ color: '#8C8C8C' }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {formatKolkataTime(order.created_at)}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
                  {order.items?.map((it) => `[${it.size_code}] ${it.flavor_name}`).join(', ')}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontWeight: 700 }}>
                  <Tag color={order.is_paid ? 'green' : 'volcano'}>
                    {order.payment_type.toUpperCase()} • {order.is_paid ? 'PAID' : 'UNPAID'}
                  </Tag>
                  <span style={{ color: '#E65100' }}>{formatINR(order.total_amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};
