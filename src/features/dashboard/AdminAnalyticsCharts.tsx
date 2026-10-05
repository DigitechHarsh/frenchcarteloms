import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import type { Order } from '../../types';
import { formatINR } from '../../lib/formatters';

interface AdminAnalyticsChartsProps {
  orders: Order[];
}

const PAYMENT_PIE_COLORS: Record<string, string> = {
  UPI: '#5C1D24', // Burgundy
  Cash: '#166534', // Forest Green
  Card: '#1E40AF', // Royal Blue
};

export const AdminAnalyticsCharts: React.FC<AdminAnalyticsChartsProps> = ({ orders }) => {
  const validOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'cancelled');
  }, [orders]);

  // 1. Flavors Sold with Bowl Size Breakdown (Vertical Bar Graph)
  const flavorSizeData = useMemo(() => {
    const flavors = ['Spicy Chipotle', 'Chilly Cheese', 'Cheese Peri Peri', 'Korean BBQ'];
    const map: Record<string, { flavor: string; Bite: number; KiloBite: number; MegaBite: number; GigaBite: number; total: number }> = {};

    flavors.forEach((fl) => {
      map[fl] = {
        flavor: fl,
        Bite: 0,
        KiloBite: 0,
        MegaBite: 0,
        GigaBite: 0,
        total: 0,
      };
    });

    validOrders.forEach((o) => {
      o.items?.forEach((it) => {
        const fl = it.flavor_name;
        if (!map[fl]) {
          map[fl] = {
            flavor: fl,
            Bite: 0,
            KiloBite: 0,
            MegaBite: 0,
            GigaBite: 0,
            total: 0,
          };
        }

        const sizeCode = it.size_code?.toUpperCase();
        if (sizeCode === 'B' || it.size_name === 'Bite') map[fl].Bite += 1;
        else if (sizeCode === 'KB' || it.size_name === 'KiloBite') map[fl].KiloBite += 1;
        else if (sizeCode === 'MB' || it.size_name === 'MegaBite') map[fl].MegaBite += 1;
        else if (sizeCode === 'GB' || it.size_name === 'GigaBite') map[fl].GigaBite += 1;

        map[fl].total += 1;
      });
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [validOrders]);

  // 2. Add-on Toppings Vertical Bar Graph
  const toppingData = useMemo(() => {
    const map: Record<string, { topping: string; count: number; revenue: number }> = {
      Nachos: { topping: 'Nachos', count: 0, revenue: 0 },
      'Extra Cheese': { topping: 'Extra Cheese', count: 0, revenue: 0 },
      Kurkure: { topping: 'Kurkure', count: 0, revenue: 0 },
    };

    validOrders.forEach((o) => {
      o.items?.forEach((it) => {
        it.toppings?.forEach((top) => {
          if (!map[top.topping_name]) {
            map[top.topping_name] = { topping: top.topping_name, count: 0, revenue: 0 };
          }
          map[top.topping_name].count += 1;
          map[top.topping_name].revenue += top.price || 0;
        });
      });
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [validOrders]);

  // 3. Payment Settlement Methods (Pie Chart)
  const paymentSettlementData = useMemo(() => {
    const payMap: Record<string, { method: string; count: number; amount: number }> = {
      UPI: { method: 'UPI', count: 0, amount: 0 },
      Cash: { method: 'Cash', count: 0, amount: 0 },
      Card: { method: 'Card', count: 0, amount: 0 },
    };

    let totalAmount = 0;

    validOrders.forEach((o) => {
      const type = (o.payment_type || 'upi').toUpperCase();
      const key = type === 'CARD' ? 'Card' : type === 'CASH' ? 'Cash' : 'UPI';
      payMap[key].count += 1;
      payMap[key].amount += o.total_amount;
      totalAmount += o.total_amount;
    });

    return Object.values(payMap).map((item) => ({
      ...item,
      percent: totalAmount > 0 ? Number(((item.amount / totalAmount) * 100).toFixed(1)) : 0,
    }));
  }, [validOrders]);

  return (
    <div className="fc-admin-charts-grid">
      {/* 1. Flavor Volume by Bowl Size (Vertical Bar Graph) */}
      <div className="fc-analytics-card">
        <div className="fc-analytics-card-header">
          <div>
            <h3 className="fc-chart-box-title">Flavors Sold by Bowl Size</h3>
            <span className="fc-chart-box-sub">
              Total flavor popularity stacked across Bite, KB, MB, and GB
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 280, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={flavorSizeData}
              margin={{ top: 15, right: 10, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 140, 140, 0.15)" vertical={false} />
              <XAxis 
                dataKey="flavor" 
                stroke="#8C8C8C" 
                fontSize={11} 
                tickLine={false}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis stroke="#8C8C8C" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const total = payload.reduce((acc: number, p: any) => acc + (p.value || 0), 0);
                    const sizeColorMap: Record<string, string> = {
                      'Bite [B]': '#FCD34D',
                      'KiloBite [KB]': '#F87171',
                      'MegaBite [MB]': '#FDA4AF',
                      'GigaBite [GB]': '#93C5FD',
                    };

                    return (
                      <div className="fc-chart-tooltip">
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#FFFFFF', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 4 }}>
                          Total Sold: <b style={{ color: '#FFFFFF' }}>{total} bowls</b>
                        </div>
                        <hr style={{ margin: '6px 0', borderColor: 'rgba(255,255,255,0.15)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {payload.map((entry: any) => (
                            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span 
                                  style={{ 
                                    display: 'inline-block', 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: 2, 
                                    background: entry.color,
                                    border: '1px solid rgba(255,255,255,0.4)' 
                                  }} 
                                />
                                <span style={{ color: sizeColorMap[entry.name] || '#F1F5F9', fontWeight: 600, fontSize: 11 }}>
                                  {entry.name}:
                                </span>
                              </div>
                              <b style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{entry.value}</b>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Bite" stackId="sizeStack" fill="#D97706" name="Bite [B]" />
              <Bar dataKey="KiloBite" stackId="sizeStack" fill="#5C1D24" name="KiloBite [KB]" />
              <Bar dataKey="MegaBite" stackId="sizeStack" fill="#8B2635" name="MegaBite [MB]" />
              <Bar dataKey="GigaBite" stackId="sizeStack" fill="#1E293B" name="GigaBite [GB]" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Add-on Topping Vertical Bar Graph */}
      <div className="fc-analytics-card">
        <div className="fc-analytics-card-header">
          <div>
            <h3 className="fc-chart-box-title">Add-on Toppings Volume</h3>
            <span className="fc-chart-box-sub">
              Paid topping units ordered across all bowls
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 280, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={toppingData}
              margin={{ top: 15, right: 10, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 140, 140, 0.15)" vertical={false} />
              <XAxis 
                dataKey="topping" 
                stroke="#8C8C8C" 
                fontSize={12} 
                tickLine={false} 
              />
              <YAxis stroke="#8C8C8C" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="fc-chart-tooltip">
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#FFFFFF', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 2 }}>
                          Units Sold: <b style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{data.count} units</b>
                        </div>
                        <div style={{ fontSize: 12, color: '#CBD5E1' }}>
                          Revenue Generated: <b style={{ color: '#FCD34D', fontFamily: 'var(--font-mono)' }}>{formatINR(data.revenue)}</b>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                name="Units Sold" 
                fill="#5C1D24" 
                radius={[4, 4, 0, 0]} 
                barSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Payment Settlement Methods (Pie Chart) */}
      <div className="fc-analytics-card">
        <div className="fc-analytics-card-header">
          <div>
            <h3 className="fc-chart-box-title">Payment Settlement Methods</h3>
            <span className="fc-chart-box-sub">
              Settlement split between UPI, Cash, and Card
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: 280, marginTop: 12, alignItems: 'center' }}>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentSettlementData}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {paymentSettlementData.map((entry) => (
                    <Cell 
                      key={`pie-cell-${entry.method}`} 
                      fill={PAYMENT_PIE_COLORS[entry.method] || '#5C1D24'} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${formatINR(Number(value))} (${item.payload.percent}%)`,
                    `${name} (${item.payload.count} orders)`
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Clean Legend Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, width: '100%', marginTop: 8 }}>
            {paymentSettlementData.map((item) => (
              <div key={item.method} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span 
                  style={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: '50%', 
                    background: PAYMENT_PIE_COLORS[item.method] || '#5C1D24' 
                  }} 
                />
                <span style={{ fontSize: 12, fontWeight: 700 }}>{item.method}:</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {item.percent}% ({formatINR(item.amount)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
