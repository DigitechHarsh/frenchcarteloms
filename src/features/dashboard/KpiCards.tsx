import React, { useEffect, useState } from 'react';
import { Card, Tag, Tooltip } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  DollarCircleFilled, 
  ShoppingFilled, 
  FireFilled, 
  CalculatorFilled, 
  ClockCircleFilled, 
  StopFilled 
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { formatINR } from '../../lib/formatters';

interface KpiData {
  totalRevenue: number;
  totalOrders: number;
  totalBowls: number;
  avgOrderValue: number;
  cancelledOrders: number;
  avgPrepTimeMins: number;
  prevRevenue: number;
  prevOrders: number;
}

interface KpiCardsProps {
  data: KpiData;
}

// Mini animated count-up hook
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

export const KpiCards: React.FC<KpiCardsProps> = ({ data }) => {
  const animatedRevenue = useCountUp(data.totalRevenue);
  const animatedOrders = useCountUp(data.totalOrders);
  const animatedBowls = useCountUp(data.totalBowls);
  const animatedAOV = useCountUp(data.avgOrderValue);

  // Revenue % change
  const revDiff = data.prevRevenue > 0 ? ((data.totalRevenue - data.prevRevenue) / data.prevRevenue) * 100 : 0;
  const isRevUp = revDiff >= 0;

  // Orders % change
  const ordDiff = data.prevOrders > 0 ? ((data.totalOrders - data.prevOrders) / data.prevOrders) * 100 : 0;
  const isOrdUp = ordDiff >= 0;

  const cards = [
    {
      title: 'TOTAL REVENUE',
      value: formatINR(animatedRevenue),
      diff: revDiff,
      isUp: isRevUp,
      icon: <DollarCircleFilled style={{ color: '#E65100', fontSize: 24 }} />,
      sparkColor: '#E65100',
      sparkPoints: '5,30 20,25 35,28 50,15 65,18 80,8 95,12',
    },
    {
      title: 'ORDERS PLACED',
      value: animatedOrders.toLocaleString('en-IN'),
      diff: ordDiff,
      isUp: isOrdUp,
      icon: <ShoppingFilled style={{ color: '#FA8C16', fontSize: 24 }} />,
      sparkColor: '#FA8C16',
      sparkPoints: '5,28 20,22 35,24 50,18 65,12 80,14 95,6',
    },
    {
      title: 'BOWLS SOLD',
      value: animatedBowls.toLocaleString('en-IN'),
      subtext: `${(data.totalBowls / Math.max(1, data.totalOrders)).toFixed(1)} bowls / order`,
      icon: <FireFilled style={{ color: '#D4380D', fontSize: 24 }} />,
      sparkColor: '#D4380D',
      sparkPoints: '5,25 20,28 35,20 50,22 65,10 80,12 95,4',
    },
    {
      title: 'AVERAGE ORDER VALUE',
      value: formatINR(animatedAOV),
      subtext: 'Ticket size',
      icon: <CalculatorFilled style={{ color: '#722ED1', fontSize: 24 }} />,
      sparkColor: '#722ED1',
      sparkPoints: '5,20 20,18 35,24 50,14 65,16 80,10 95,8',
    },
    {
      title: 'AVG PREP TIME',
      value: `${data.avgPrepTimeMins} mins`,
      subtext: 'Order-to-ready speed',
      icon: <ClockCircleFilled style={{ color: '#13C2C2', fontSize: 24 }} />,
      sparkColor: '#13C2C2',
      sparkPoints: '5,14 20,16 35,12 50,18 65,10 80,8 95,10',
    },
    {
      title: 'CANCELLED ORDERS',
      value: data.cancelledOrders,
      subtext: `${((data.cancelledOrders / Math.max(1, data.totalOrders)) * 100).toFixed(1)}% drop rate`,
      icon: <StopFilled style={{ color: '#CF1322', fontSize: 24 }} />,
      sparkColor: '#CF1322',
      sparkPoints: '5,20 20,16 35,24 50,15 65,18 80,22 95,14',
    },
  ];

  return (
    <div className="fc-kpi-grid">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="fc-kpi-card"
        >
          <div className="fc-kpi-top">
            <span className="fc-kpi-title">{card.title}</span>
            <div className="fc-kpi-icon-wrap">{card.icon}</div>
          </div>

          <div className="fc-kpi-val-row">
            <span className="fc-kpi-value">{card.value}</span>
            {/* SVG Sparkline */}
            <div className="fc-kpi-sparkline">
              <svg width="60" height="26" viewBox="0 0 100 35">
                <polyline
                  fill="none"
                  stroke={card.sparkColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={card.sparkPoints}
                />
              </svg>
            </div>
          </div>

          <div className="fc-kpi-bottom">
            {card.diff !== undefined ? (
              <span className={`fc-kpi-diff ${card.isUp ? 'up' : 'down'}`}>
                {card.isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(card.diff).toFixed(1)}% vs prev period
              </span>
            ) : (
              <span className="fc-kpi-subtext">{card.subtext}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
