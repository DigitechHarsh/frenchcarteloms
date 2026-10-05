import React, { useEffect, useState } from 'react';
import { Card, Progress } from 'antd';
import { motion } from 'framer-motion';
import { formatINR } from '../../lib/formatters';

interface CircularKpiGaugesProps {
  totalRevenue: number;
  totalOrders: number;
  totalBowls: number;
  totalMenuItems: number;
  prevRevenue: number;
  prevOrders: number;
}

function useCountUp(target: number, duration: number = 0.3) {
  const [val, setVal] = useState(target);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end || !target) {
      setVal(end);
      return;
    }

    const totalSteps = 6;
    const stepTime = (duration * 1000) / totalSteps;
    const stepIncrement = (end - start) / totalSteps;
    let current = start;

    const timer = setInterval(() => {
      current += stepIncrement;
      if ((stepIncrement > 0 && current >= end) || (stepIncrement < 0 && current <= end)) {
        setVal(end);
        clearInterval(timer);
      } else {
        setVal(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return val;
}

export const CircularKpiGauges: React.FC<CircularKpiGaugesProps> = ({
  totalRevenue,
  totalOrders,
  totalBowls,
  totalMenuItems,
}) => {
  const animatedRevenue = useCountUp(totalRevenue);
  const animatedOrders = useCountUp(totalOrders);
  const animatedBowls = useCountUp(totalBowls);

  const kpis = [
    {
      title: 'Total Menu',
      value: totalMenuItems || 14,
      percent: 85,
      type: 'circle' as const,
      color: '#FA8C16',
      iconText: '🍟',
    },
    {
      title: 'Total Revenue',
      value: formatINR(animatedRevenue),
      percent: 78,
      type: 'circle' as const,
      color: '#E65100',
      iconText: '₹',
    },
    {
      title: 'Total Orders',
      value: animatedOrders,
      percent: 65,
      type: 'circle' as const,
      color: '#FAAD14',
      iconText: '📦',
    },
    {
      title: 'Bowls Sold',
      value: animatedBowls,
      percent: 92,
      type: 'circle' as const,
      color: '#FF7A00',
      iconText: '🥣',
    },
  ];

  return (
    <div className="fc-riday-kpi-grid">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: idx * 0.05 }}
          className="fc-riday-kpi-card"
        >
          <div className="fc-riday-kpi-info">
            <span className="fc-riday-kpi-label">{kpi.title}</span>
            <span className="fc-riday-kpi-number">{kpi.value}</span>
          </div>

          <div className="fc-riday-kpi-gauge">
            <Progress
              type="circle"
              percent={kpi.percent}
              width={54}
              strokeWidth={8}
              strokeColor={kpi.color}
              format={() => (
                <span style={{ fontSize: 13, fontWeight: 700, color: kpi.color }}>
                  {kpi.iconText}
                </span>
              )}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
