import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, Row, Col, Statistic } from 'antd';
import { formatINR } from '../../lib/formatters';

interface PaymentAndPrepChartsProps {
  paymentData: { method: string; count: number; amount: number }[];
  paidVsUnpaid: { paidAmount: number; unpaidAmount: number };
  chefPrepData: { chef: string; avgMins: number; ordersCount: number }[];
  prepDistributionData: { range: string; count: number }[];
  onFilterPayment?: (method: string) => void;
  onFilterChef?: (chef: string) => void;
  activeFilter?: string | null;
}

const PAYMENT_COLORS = ['#52C41A', '#1890FF', '#FAAD14'];

export const PaymentAndPrepCharts: React.FC<PaymentAndPrepChartsProps> = ({
  paymentData,
  paidVsUnpaid,
  chefPrepData,
  prepDistributionData,
  onFilterPayment,
  onFilterChef,
  activeFilter,
}) => {
  return (
    <Row gutter={[16, 16]}>
      {/* 1. Payment Split & Status */}
      <Col xs={24} lg={12}>
        <Card className="fc-chart-card" title="Payment Methods & Settlement">
          <span className="fc-chart-subtitle">
            UPI vs Card vs Cash distribution • Click payment method to filter table
          </span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12 }}>
            <div style={{ width: '55%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="amount"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    cursor="pointer"
                    onClick={(entry) => onFilterPayment?.(entry.method.toLowerCase())}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell
                        key={`cell-pay-${index}`}
                        fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                        stroke={activeFilter === entry.method.toLowerCase() ? '#FFFFFF' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E1E', borderRadius: 8, color: '#FFF' }}
                    formatter={(val: any) => [formatINR(Number(val)), 'Total Revenue']}
                  />
                  <Legend verticalAlign="bottom" height={30} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="fc-settlement-box paid">
                <span className="fc-settlement-label">PAID SETTLED</span>
                <span className="fc-settlement-val">{formatINR(paidVsUnpaid.paidAmount)}</span>
              </div>
              <div className="fc-settlement-box unpaid">
                <span className="fc-settlement-label">PENDING / UNPAID</span>
                <span className="fc-settlement-val unpaid">{formatINR(paidVsUnpaid.unpaidAmount)}</span>
              </div>
            </div>
          </div>
        </Card>
      </Col>

      {/* 2. Chef Kitchen Prep Times */}
      <Col xs={24} lg={12}>
        <Card className="fc-chart-card" title="Chef Performance & Speed">
          <span className="fc-chart-subtitle">
            Average preparation speed (minutes) • Click chef to filter table
          </span>
          <div style={{ width: '100%', height: 230, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chefPrepData}
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                onClick={(state) => {
                  if (state && state.activePayload && state.activePayload[0]) {
                    onFilterChef?.(state.activePayload[0].payload.chef);
                  }
                }}
              >
                <XAxis dataKey="chef" stroke="#8C8C8C" fontSize={12} />
                <YAxis
                  stroke="#8C8C8C"
                  fontSize={12}
                  tickFormatter={(val) => `${val}m`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E1E', borderRadius: 8, color: '#FFF' }}
                  formatter={(val: any) => [`${val} minutes average`, 'Speed']}
                />
                <Bar
                  dataKey="avgMins"
                  name="Avg Prep Time (Minutes)"
                  fill="#13C2C2"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                >
                  {chefPrepData.map((entry, index) => (
                    <Cell
                      key={`cell-chef-${index}`}
                      fill={activeFilter === entry.chef ? '#FFD13B' : '#13C2C2'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>
    </Row>
  );
};
