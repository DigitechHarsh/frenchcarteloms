import React from 'react';
import { Tag, Badge } from 'antd';
import { FireOutlined } from '@ant-design/icons';
import { Order } from '../../types';

interface BatchCookingSummaryProps {
  orders: Order[]; // active orders (new and preparing)
}

export const BatchCookingSummary: React.FC<BatchCookingSummaryProps> = ({ orders }) => {
  // Aggregate bowls by flavor and size
  const flavorCounts: Record<string, number> = {};
  const sizeCounts: Record<string, number> = {};
  let totalActiveBowls = 0;

  orders.forEach((o) => {
    o.items?.forEach((item) => {
      totalActiveBowls++;
      flavorCounts[item.flavor_name] = (flavorCounts[item.flavor_name] || 0) + 1;
      sizeCounts[item.size_name] = (sizeCounts[item.size_name] || 0) + 1;
    });
  });

  if (totalActiveBowls === 0) return null;

  return (
    <div className="fc-batch-summary-bar">
      <div className="fc-batch-title">
        <FireOutlined style={{ color: '#E65100', fontSize: 18 }} />
        <span>BATCH PREP ({totalActiveBowls} bowls pending):</span>
      </div>

      <div className="fc-batch-groups">
        {/* By Flavor */}
        <div className="fc-batch-pills">
          <span className="fc-batch-sublabel">Flavors:</span>
          {Object.entries(flavorCounts).map(([flavor, count]) => (
            <Tag key={flavor} color="volcano" className="fc-batch-tag">
              {flavor}: <b>{count}</b>
            </Tag>
          ))}
        </div>

        {/* By Size */}
        <div className="fc-batch-pills">
          <span className="fc-batch-sublabel">Sizes:</span>
          {Object.entries(sizeCounts).map(([size, count]) => (
            <Tag key={size} color="orange" className="fc-batch-tag">
              {size}: <b>{count}</b>
            </Tag>
          ))}
        </div>
      </div>
    </div>
  );
};
