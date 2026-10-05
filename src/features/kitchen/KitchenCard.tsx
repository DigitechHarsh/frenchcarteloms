import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tag, Button, Dropdown, MenuProps, Tooltip } from 'antd';
import { 
  ThunderboltOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  CheckOutlined, 
  ArrowRightOutlined,
  StopOutlined,
  HolderOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { Order } from '../../types';
import { formatINR } from '../../lib/formatters';

interface KitchenCardProps {
  order: Order;
  amberThresholdMins: number;
  redThresholdMins: number;
  onAdvanceStatus: (orderId: string, currentStatus: Order['status']) => void;
  onAssignChef: (orderId: string, chef: string) => void;
  onCancelOrder: (orderId: string) => void;
  isNewFlash?: boolean;
}

export const KitchenCard: React.FC<KitchenCardProps> = ({
  order,
  amberThresholdMins,
  redThresholdMins,
  onAdvanceStatus,
  onAssignChef,
  onCancelOrder,
  isNewFlash,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id, data: { order } });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live elapsed timer calculation
  useEffect(() => {
    const calculateElapsed = () => {
      const createdTime = dayjs(order.created_at).valueOf();
      const now = dayjs().valueOf();
      const diffSecs = Math.max(0, Math.floor((now - createdTime) / 1000));
      setElapsedSeconds(diffSecs);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const elapsedMins = Math.floor(elapsedSeconds / 60);
  const remainingSecs = elapsedSeconds % 60;
  const timeFormatted = `${elapsedMins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;

  // Timer color threshold
  let timerBadgeColor = '#52C41A'; // Green (< 10 min)
  let timerClass = 'timer-green';
  if (elapsedMins >= redThresholdMins) {
    timerBadgeColor = '#CF1322'; // Red (> 15 min)
    timerClass = 'timer-red';
  } else if (elapsedMins >= amberThresholdMins) {
    timerBadgeColor = '#FA8C16'; // Amber (10 - 15 min)
    timerClass = 'timer-amber';
  }

  const chefMenuItems: MenuProps['items'] = [
    {
      key: 'Chef 1',
      label: 'Assign to Chef 1',
      onClick: () => onAssignChef(order.id, 'Chef 1'),
    },
    {
      key: 'Chef 2',
      label: 'Assign to Chef 2',
      onClick: () => onAssignChef(order.id, 'Chef 2'),
    },
    {
      key: 'Unassigned',
      label: 'Unassign Chef',
      onClick: () => onAssignChef(order.id, ''),
    },
  ];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`fc-sticky-card ${isNewFlash ? 'flash-animation' : ''}`}
    >
      {/* Tape decor on top */}
      <div className="fc-sticky-tape" />

      {/* Header: Drag handle, Token & Live Elapsed Timer */}
      <div className="fc-sticky-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span {...attributes} {...listeners} className="fc-drag-handle">
            <HolderOutlined />
          </span>
          <span className="fc-sticky-token">#{order.token_number}</span>
        </div>

        <div className={`fc-sticky-timer ${timerClass}`}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          <span>{timeFormatted}</span>
        </div>
      </div>

      {/* Customer Name & Notes */}
      {(order.customer_name || order.notes) && (
        <div className="fc-sticky-meta">
          {order.customer_name && <span className="fc-customer-tag">👤 {order.customer_name}</span>}
          {order.notes && <div className="fc-sticky-notes">📝 <b>Note:</b> {order.notes}</div>}
        </div>
      )}

      {/* Bowls List (The Digital Sticky Note Recipe) */}
      <div className="fc-sticky-items">
        {order.items?.map((item, idx) => (
          <div key={idx} className="fc-sticky-bowl-row">
            <div className="fc-bowl-header-line">
              <Tag color="#D4380D" style={{ fontWeight: 800 }}>
                {item.size_code}
              </Tag>
              <span className="fc-bowl-flavor-text">{item.flavor_name}</span>
            </div>

            {/* Paid toppings */}
            {item.toppings && item.toppings.length > 0 && (
              <span className="fc-bowl-paid-toppings">
                🧀 {item.toppings.map((t) => t.topping_name).join(', ')}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer: Chef Assignment & Action Buttons */}
      <div className="fc-sticky-footer">
        <Dropdown menu={{ items: chefMenuItems }} trigger={['click']}>
          <Button size="small" type="dashed" icon={<UserOutlined />}>
            {order.assigned_chef || 'Assign Chef'}
          </Button>
        </Dropdown>

        <div className="fc-card-actions">
          <Tooltip title="Cancel Order">
            <Button
              type="text"
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => onCancelOrder(order.id)}
            />
          </Tooltip>

          {/* Action Tap Button */}
          {order.status === 'new' && (
            <Button
              type="primary"
              size="middle"
              className="fc-kitchen-btn start"
              onClick={() => onAdvanceStatus(order.id, 'new')}
            >
              Start ➔
            </Button>
          )}

          {order.status === 'preparing' && (
            <Button
              type="primary"
              size="middle"
              className="fc-kitchen-btn ready"
              onClick={() => onAdvanceStatus(order.id, 'preparing')}
            >
              Mark Ready ✓
            </Button>
          )}

          {order.status === 'ready' && (
            <Button
              type="primary"
              size="middle"
              className="fc-kitchen-btn complete"
              onClick={() => onAdvanceStatus(order.id, 'ready')}
            >
              Served / Done ✓
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
