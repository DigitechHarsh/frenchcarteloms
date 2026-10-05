import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Tag, Badge } from 'antd';
import { Order } from '../../types';
import { KitchenCard } from './KitchenCard';

interface KitchenColumnProps {
  id: string; // 'new' | 'preparing' | 'ready'
  title: string;
  count: number;
  orders: Order[];
  amberThresholdMins: number;
  redThresholdMins: number;
  onAdvanceStatus: (orderId: string, currentStatus: Order['status']) => void;
  onAssignChef: (orderId: string, chef: string) => void;
  onCancelOrder: (orderId: string) => void;
  newOrderIdFlash?: string | null;
}

const columnStyles: Record<string, { accent: string; bg: string }> = {
  new: { accent: '#1890FF', bg: 'rgba(24, 144, 255, 0.05)' },
  preparing: { accent: '#FA8C16', bg: 'rgba(250, 140, 22, 0.05)' },
  ready: { accent: '#52C41A', bg: 'rgba(82, 196, 26, 0.05)' },
};

export const KitchenColumn: React.FC<KitchenColumnProps> = ({
  id,
  title,
  count,
  orders,
  amberThresholdMins,
  redThresholdMins,
  onAdvanceStatus,
  onAssignChef,
  onCancelOrder,
  newOrderIdFlash,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const theme = columnStyles[id] || { accent: '#FA8C16', bg: '#FFF' };

  return (
    <div
      ref={setNodeRef}
      className={`fc-kitchen-column ${isOver ? 'column-drop-over' : ''}`}
      style={{ borderTopColor: theme.accent }}
    >
      {/* Column Title Bar */}
      <div className="fc-column-header">
        <div className="fc-column-title">
          <span className="fc-col-dot" style={{ backgroundColor: theme.accent }} />
          <span>{title}</span>
        </div>
        <Badge
          count={count}
          style={{ backgroundColor: theme.accent, fontWeight: 700, fontSize: 13 }}
        />
      </div>

      {/* Column Cards Drop Area */}
      <div className="fc-column-cards">
        <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {orders.length === 0 ? (
            <div className="fc-column-empty">
              <span>No orders {title.toLowerCase()}</span>
            </div>
          ) : (
            orders.map((order) => (
              <KitchenCard
                key={order.id}
                order={order}
                amberThresholdMins={amberThresholdMins}
                redThresholdMins={redThresholdMins}
                onAdvanceStatus={onAdvanceStatus}
                onAssignChef={onAssignChef}
                onCancelOrder={onCancelOrder}
                isNewFlash={newOrderIdFlash === order.id}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
