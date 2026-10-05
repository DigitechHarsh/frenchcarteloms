import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  Cell
} from 'recharts';
import { Card } from 'antd';
import { formatINR } from '../../lib/formatters';

interface HourlyDataPoint {
  hour: string; // e.g. "12 PM", "1 PM"
  orders: number;
  revenue: number;
}

interface HourlySalesChartProps {
  data: HourlyDataPoint[];
  onSelectHour?: (hour: string) => void;
  selectedHour?: string | null;
}

export const HourlySalesChart: React.FC<HourlySalesChartProps> = ({
  data,
  onSelectHour,
  selectedHour,
}) => {
  return (
    <Card className="fc-chart-card">
      <div className="fc-chart-header">
        <div>
          <h3 className="fc-chart-title">Hourly Sales & Peak Rush Hours</h3>
          <span className="fc-chart-subtitle">
            Sales distribution across operating hours • Click an hour bar to filter table
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload[0]) {
                const hour = state.activePayload[0].payload.hour;
                onSelectHour?.(hour);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="hour" stroke="#8C8C8C" fontSize={12} tickLine={false} />
            <YAxis yAxisId="left" stroke="#8C8C8C" fontSize={12} tickLine={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#8C8C8C"
              fontSize={12}
              tickLine={false}
              tickFormatter={(val) => `Rs ${val / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E1E1E',
                borderRadius: 10,
                border: 'none',
                color: '#FFF',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
              formatter={(val: any, name: any) => [
                name === 'Revenue' ? formatINR(Number(val)) : `${val} Orders`,
                name,
              ]}
              labelFormatter={(label) => `⏰ Time: ${label} (Click to filter table)`}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar
              yAxisId="left"
              dataKey="orders"
              name="Orders"
              fill="#FA8C16"
              radius={[6, 6, 0, 0]}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-orders-${index}`}
                  fill={selectedHour === entry.hour ? '#FFD13B' : '#FA8C16'}
                />
              ))}
            </Bar>
            <Bar
              yAxisId="right"
              dataKey="revenue"
              name="Revenue"
              fill="#E65100"
              radius={[6, 6, 0, 0]}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-rev-${index}`}
                  fill={selectedHour === entry.hour ? '#D32F2F' : '#E65100'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
