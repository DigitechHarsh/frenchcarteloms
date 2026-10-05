import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Brush, 
  Legend 
} from 'recharts';
import { Radio, Card } from 'antd';
import { formatINR } from '../../lib/formatters';

interface DailyDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueTrendChartProps {
  data: DailyDataPoint[];
  onSelectDate?: (date: string) => void;
  selectedDate?: string | null;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data,
  onSelectDate,
  selectedDate,
}) => {
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');

  const handleClick = (point: any) => {
    if (point && point.activePayload && point.activePayload[0]) {
      const clickedDate = point.activePayload[0].payload.date;
      onSelectDate?.(clickedDate);
    }
  };

  return (
    <Card className="fc-chart-card">
      <div className="fc-chart-header">
        <div>
          <h3 className="fc-chart-title">Revenue & Orders Trend</h3>
          <span className="fc-chart-subtitle">
            Daily performance timeline • Brush slider below to zoom • Click date to filter table
          </span>
        </div>

        <Radio.Group
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="revenue">Revenue (Rs)</Radio.Button>
          <Radio.Button value="orders">Orders (#)</Radio.Button>
        </Radio.Group>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            onClick={handleClick}
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="date" stroke="#8C8C8C" fontSize={12} tickLine={false} />
            <YAxis
              stroke="#8C8C8C"
              fontSize={12}
              tickLine={false}
              tickFormatter={(val) => (metric === 'revenue' ? `Rs ${val / 1000}k` : `${val}`)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E1E1E',
                borderRadius: 10,
                border: 'none',
                color: '#FFF',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
              formatter={(val: any) => [
                metric === 'revenue' ? formatINR(Number(val)) : `${val} Orders`,
                metric === 'revenue' ? 'Revenue' : 'Orders',
              ]}
              labelFormatter={(label) => `📅 Date: ${label} (Click to filter table)`}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey={metric}
              name={metric === 'revenue' ? 'Daily Revenue (Rs)' : 'Orders Placed'}
              stroke={metric === 'revenue' ? '#5C1D24' : '#1890FF'}
              strokeWidth={3}
              dot={{ r: 4, fill: metric === 'revenue' ? '#5C1D24' : '#1890FF', stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: metric === 'revenue' ? '#5C1D24' : '#1890FF', stroke: '#FCD34D', strokeWidth: 2 }}
            />
            <Brush
              dataKey="date"
              height={26}
              stroke="#5C1D24"
              fill="rgba(92, 29, 36, 0.08)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
