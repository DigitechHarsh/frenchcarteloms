import React, { useEffect } from 'react';
import { Modal, Button, Tag, Typography, Divider } from 'antd';
import { CheckCircleFilled, PlusCircleOutlined } from '@ant-design/icons';
import confetti from 'canvas-confetti';
import type { Order } from '../../types';
import { formatINR, formatKolkataTime } from '../../lib/formatters';

const { Text } = Typography;

interface OrderConfirmationModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  open,
  onClose,
}) => {
  useEffect(() => {
    if (open && order) {
      // Fire celebratory confetti
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E65100', '#F5A623', '#FFD13B', '#D32F2F'],
      });
    }
  }, [open, order]);

  if (!order) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={460}
      className="fc-order-confirm-modal"
    >
      <div style={{ textAlign: 'center', padding: '16px 8px' }}>
        <CheckCircleFilled style={{ fontSize: 52, color: '#52C41A', marginBottom: 12 }} />

        <Text type="secondary" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
          Order Placed Successfully
        </Text>

        {/* Big Token Callout */}
        <div className="fc-token-hero">
          <span className="fc-token-prefix">PRIORITY TOKEN</span>
          <span className="fc-token-big-num">#{order.token_number}</span>
        </div>

        <div className="fc-confirm-details-box">
          <div className="fc-confirm-row">
            <span>Customer:</span>
            <b>{order.customer_name || 'Walk-in Customer'}</b>
          </div>
          <div className="fc-confirm-row">
            <span>Time:</span>
            <b>{formatKolkataTime(order.created_at)}</b>
          </div>
          <div className="fc-confirm-row">
            <span>Payment:</span>
            <span>
              <Tag color={order.is_paid ? 'green' : 'red'}>
                {order.payment_type.toUpperCase()} • {order.is_paid ? 'PAID' : 'UNPAID'}
              </Tag>
            </span>
          </div>
          <div className="fc-confirm-row">
            <span>Total:</span>
            <b style={{ color: '#E65100', fontSize: 18 }}>{formatINR(order.total_amount)}</b>
          </div>
        </div>

        {/* Bowls List Summary */}
        <div className="fc-confirm-items-summary">
          <Text strong style={{ display: 'block', textAlign: 'left', marginBottom: 6, fontSize: 13 }}>
            Bowls Sent to Kitchen ({order.items?.length || 0}):
          </Text>
          {order.items?.map((item, idx) => (
            <div key={idx} className="fc-confirm-item-line">
              <span>
                <b>[{item.size_code}]</b> {item.flavor_name}
              </span>
              <span>{formatINR(item.price)}</span>
            </div>
          ))}
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* Action Button */}
        <Button
          type="primary"
          size="large"
          icon={<PlusCircleOutlined />}
          onClick={onClose}
          style={{ width: '100%', height: 56, fontSize: 17, fontWeight: 700 }}
        >
          Next Order (Space / Enter)
        </Button>
      </div>
    </Modal>
  );
};
