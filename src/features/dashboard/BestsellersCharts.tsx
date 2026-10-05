import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, Row, Col, Progress, Tag } from 'antd';

interface BestsellersChartsProps {
  sizeData: { name: string; count: number; revenue: number }[];
  flavorData: { name: string; count: number }[];
  toppingData: { name: string; count: number }[];
  freeToppingData: { name: string; count: number; percent: number }[];
  onFilterItem?: (type: 'size' | 'flavor' | 'topping' | 'free', name: string) => void;
  activeFilter?: string | null;
}

const FLAVOR_COLORS = ['#D4380D', '#FA8C16', '#FAAD14', '#873800'];
const FREE_COLORS = {
  Jalapeno: '#389E0D',
  Olives: '#262626',
  None: '#8C8C8C',
};

export const BestsellersCharts: React.FC<BestsellersChartsProps> = ({
  sizeData,
  flavorData,
  toppingData,
  freeToppingData,
  onFilterItem,
  activeFilter,
}) => {
  return (
    <div className="fc-bestsellers-section">
      <Row gutter={[16, 16]}>
        {/* 1. Size Distribution (Bar Chart) */}
        <Col xs={24} lg={12}>
          <Card className="fc-chart-card" title="Bowl Sizes Popularity">
            <span className="fc-chart-subtitle">
              Quantity sold by size • Click size to filter table
            </span>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sizeData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                  onClick={(state) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      onFilterItem?.('size', state.activePayload[0].payload.name);
                    }
                  }}
                >
                  <XAxis type="number" stroke="#8C8C8C" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#8C8C8C" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E1E', borderRadius: 8, color: '#FFF' }}
                    formatter={(val: any) => [`${val} Bowls Sold`, 'Volume']}
                  />
                  <Bar
                    dataKey="count"
                    name="Bowls Sold"
                    fill="#FAAD14"
                    radius={[0, 6, 6, 0]}
                    cursor="pointer"
                  >
                    {sizeData.map((entry, index) => (
                      <Cell
                        key={`cell-size-${index}`}
                        fill={activeFilter === entry.name ? '#FF4D4F' : '#FAAD14'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* 2. Flavor Split (Donut Chart) */}
        <Col xs={24} lg={12}>
          <Card className="fc-chart-card" title="Flavor Dust Popularity">
            <span className="fc-chart-subtitle">
              Flavor preference share • Click flavor to filter table
            </span>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={flavorData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    cursor="pointer"
                    onClick={(entry) => onFilterItem?.('flavor', entry.name)}
                  >
                    {flavorData.map((entry, index) => (
                      <Cell
                        key={`cell-flavor-${index}`}
                        fill={FLAVOR_COLORS[index % FLAVOR_COLORS.length]}
                        stroke={activeFilter === entry.name ? '#FFFFFF' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E1E', borderRadius: 8, color: '#FFF' }}
                    formatter={(val: any) => [`${val} orders`, 'Flavored Bowls']}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* 3. Paid Toppings Volume (Bar Chart) */}
        <Col xs={24} lg={12}>
          <Card className="fc-chart-card" title="Add-on Toppings Volume">
            <span className="fc-chart-subtitle">
              Nachos vs Extra Cheese vs Kurkure • Click to filter
            </span>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={toppingData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  onClick={(state) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      onFilterItem?.('topping', state.activePayload[0].payload.name);
                    }
                  }}
                >
                  <XAxis dataKey="name" stroke="#8C8C8C" fontSize={12} />
                  <YAxis stroke="#8C8C8C" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E1E1E', borderRadius: 8, color: '#FFF' }}
                    formatter={(val: any) => [`${val} portions`, 'Added']}
                  />
                  <Bar
                    dataKey="count"
                    name="Portions Added"
                    fill="#E65100"
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                  >
                    {toppingData.map((entry, index) => (
                      <Cell
                        key={`cell-top-${index}`}
                        fill={activeFilter === entry.name ? '#FFD13B' : '#E65100'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* 4. Free Fresh Topping Split: Jalapeno vs Olives vs None */}
        <Col xs={24} lg={12}>
          <Card className="fc-chart-card" title="Free Fresh Topping Split">
            <span className="fc-chart-subtitle">
              Strict 1-only rule: Jalapeno vs Olives vs None adoption
            </span>
            <div style={{ padding: '16px 8px' }}>
              {freeToppingData.map((item) => {
                const color = FREE_COLORS[item.name as keyof typeof FREE_COLORS] || '#8C8C8C';
                const isSelected = activeFilter === item.name;

                return (
                  <div
                    key={item.name}
                    style={{
                      marginBottom: 18,
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: 8,
                      backgroundColor: isSelected ? 'rgba(230, 81, 0, 0.12)' : 'transparent',
                    }}
                    onClick={() => onFilterItem?.('free', item.name)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>
                        {item.name === 'Jalapeno' && '🌶️ '}
                        {item.name === 'Olives' && '🫒 '}
                        {item.name === 'None' && '🚫 '}
                        {item.name}
                      </span>
                      <span style={{ fontWeight: 700, color }}>
                        {item.percent}% ({item.count} bowls)
                      </span>
                    </div>
                    <Progress
                      percent={item.percent}
                      strokeColor={color}
                      showInfo={false}
                      strokeWidth={12}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
