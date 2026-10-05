import React from 'react';
import { Drawer, Tag, Timeline, Divider, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  FireOutlined, 
  SmileOutlined, 
  CloseCircleOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { Order } from '../../types';
import { formatINR, formatKolkataDateTime, formatKolkataTime } from '../../lib/formatters';

interface OrderDetailDrawerProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  open,
  onClose,
}) => {
  if (!order) return null;

  const timelineItems = [
    {
      dot: <ClockCircleOutlined style={{ fontSize: 16, color: '#1890FF' }} />,
      children: (
        <div>
          <b>Order Placed:</b> {formatKolkataDateTime(order.created_at)}
        </div>
      ),
    },
    order.preparing_at && {
      dot: <FireOutlined style={{ fontSize: 16, color: '#FA8C16' }} />,
      children: (
        <div>
          <b>Cooking Started:</b> {formatKolkataTime(order.preparing_at)}
        </div>
      ),
    },
    order.ready_at && {
      dot: <CheckCircleOutlined style={{ fontSize: 16, color: '#52C41A' }} />,
      children: (
        <div>
          <b>Marked Ready:</b> {formatKolkataTime(order.ready_at)}
        </div>
      ),
    },
    order.completed_at && {
      dot: <SmileOutlined style={{ fontSize: 16, color: '#722ED1' }} />,
      children: (
        <div>
          <b>Order Handed to Customer:</b> {formatKolkataTime(order.completed_at)}
        </div>
      ),
    },
    order.status === 'cancelled' && {
      dot: <CloseCircleOutlined style={{ fontSize: 16, color: '#CF1322' }} />,
      children: (
        <div style={{ color: '#CF1322' }}>
          <b>Order Cancelled:</b> {order.cancellation_reason || 'Cancelled by staff'}
        </div>
      ),
    },
  ].filter(Boolean) as any[];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '92%' }}>
          <span>Order #{order.token_number} Details</span>
          <Tag color={order.is_paid ? 'green' : 'red'}>
            {order.payment_type.toUpperCase()} • {order.is_paid ? 'PAID' : 'UNPAID'}
          </Tag>
        </div>
      }
      placement="right"
      width={420}
      onClose={onClose}
      open={open}
    >
      {/* Header Info */}
      <div className="fc-drawer-header-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#8C8C8C' }}>Order Date:</span>
          <b>{order.order_date}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#8C8C8C' }}>Customer Name:</span>
          <b>{order.customer_name || 'Walk-in Customer'}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#8C8C8C' }}>Assigned Chef:</span>
          <b>{order.assigned_chef || 'Unassigned'}</b>
        </div>
        {order.notes && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#8C8C8C' }}>Kitchen Notes:</span>
            <b>{order.notes}</b>
          </div>
        )}
      </div>

      <Divider style={{ margin: '14px 0' }}>Bowls in Order</Divider>

      {/* Bowls Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {order.items?.map((item, idx) => (
          <div key={idx} className="fc-drawer-item-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <Tag color="#E65100" style={{ fontWeight: 800 }}>{item.size_code}</Tag>
                <b>{item.size_name} Fries</b>
              </span>
              <span style={{ fontWeight: 700 }}>{formatINR(item.price)}</span>
            </div>

            <div style={{ fontSize: 13, marginTop: 4 }}>
              🔥 <b>Flavor:</b> {item.flavor_name}
            </div>

            {item.free_topping && item.free_topping !== 'None' && (
              <div style={{ fontSize: 12, color: '#389E0D', marginTop: 2 }}>
                🌿 <b>Free Topping:</b> {item.free_topping}
              </div>
            )}

            {item.toppings && item.toppings.length > 0 && (
              <div style={{ fontSize: 12, color: '#D46B08', marginTop: 2 }}>
                🧀 <b>Toppings:</b> {item.toppings.map((t) => `${t.topping_name} (+${formatINR(t.price)})`).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '18px 0', fontSize: 16 }}>
        <span>Total Order Amount:</span>
        <b style={{ color: '#E65100', fontSize: 20 }}>{formatINR(order.total_amount)}</b>
      </div>

      <Divider style={{ margin: '14px 0' }}>Order Timeline</Divider>

      {/* Timeline */}
      <Timeline items={timelineItems} style={{ marginTop: 12 }} />

      <Button
        icon={<PrinterOutlined />}
        size="large"
        block
        style={{ marginTop: 16 }}
        onClick={() => window.print()}
      >
        Print Receipt Slip
      </Button>
    </Drawer>
  );
};
