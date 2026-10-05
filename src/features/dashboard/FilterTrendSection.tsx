import React, { useState, useMemo } from 'react';
import { Radio, Table, Select, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import type { Dayjs } from 'dayjs';
import type { Order } from '../../types';
import { formatINR } from '../../lib/formatters';

interface FilterTrendSectionProps {
  orders: Order[];
  dateRange: [Dayjs, Dayjs];
}

interface TopFlavorRow {
  key: string;
  rank: number;
  flavor: string;
  sizeName: string;
  sizeCode: string;
  bowlsSold: number;
  revenue: number;
  sharePercent: number;
}

export const FilterTrendSection: React.FC<FilterTrendSectionProps> = ({
  orders,
  dateRange,
}) => {
  // Filters
  const [selectedBowlSize, setSelectedBowlSize] = useState<string>('ALL');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('ALL');
  const [selectedAddon, setSelectedAddon] = useState<string>('ALL');
  const [metric, setMetric] = useState<'revenue' | 'bowls'>('revenue');

  // Non-cancelled orders
  const validOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'cancelled');
  }, [orders]);

  // Total bowls count overall
  const totalBowlsSold = useMemo(() => {
    return validOrders.reduce((acc, o) => acc + (o.items?.length || 0), 0);
  }, [validOrders]);

  // 1. Bowl Size sold counts
  const bowlCounts = useMemo(() => {
    const counts = { B: 0, KB: 0, MB: 0, GB: 0 };
    validOrders.forEach((o) => {
      o.items?.forEach((it) => {
        const code = it.size_code?.toUpperCase();
        if (code === 'B' || it.size_name === 'Bite') counts.B++;
        else if (code === 'KB' || it.size_name === 'KiloBite') counts.KB++;
        else if (code === 'MB' || it.size_name === 'MegaBite') counts.MB++;
        else if (code === 'GB' || it.size_name === 'GigaBite') counts.GB++;
      });
    });
    return counts;
  }, [validOrders]);

  // 2. Flavor sold counts
  const flavorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Spicy Chipotle': 0,
      'Chilly Cheese': 0,
      'Cheese Peri Peri': 0,
      'Korean BBQ': 0,
    };
    validOrders.forEach((o) => {
      o.items?.forEach((it) => {
        if (counts[it.flavor_name] !== undefined) {
          counts[it.flavor_name]++;
        }
      });
    });
    return counts;
  }, [validOrders]);

  // 3. Add-on counts
  const addonCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Nachos': 0,
      'Extra Cheese': 0,
      'Kurkure': 0,
    };
    validOrders.forEach((o) => {
      o.items?.forEach((it) => {
        it.toppings?.forEach((top) => {
          if (counts[top.topping_name] !== undefined) {
            counts[top.topping_name]++;
          }
        });
      });
    });
    return counts;
  }, [validOrders]);

  // 4. Dynamic Filtered Graph Timeline Data
  const filteredTrendData = useMemo(() => {
    const map: Record<string, { revenue: number; bowls: number }> = {};
    let cur = dateRange[0].clone();
    const end = dateRange[1].clone();

    while (cur.isBefore(end) || cur.isSame(end, 'day')) {
      const dStr = cur.format('YYYY-MM-DD');
      map[dStr] = { revenue: 0, bowls: 0 };
      cur = cur.add(1, 'day');
    }

    validOrders.forEach((o) => {
      if (!map[o.order_date]) return;

      o.items?.forEach((it) => {
        // Size match
        const matchesSize =
          selectedBowlSize === 'ALL' ||
          it.size_code?.toUpperCase() === selectedBowlSize ||
          it.size_name?.toLowerCase().includes(selectedBowlSize.toLowerCase());

        // Flavor match
        const matchesFlavor =
          selectedFlavor === 'ALL' || it.flavor_name === selectedFlavor;

        // Addon match
        let matchesAddon = true;
        if (selectedAddon === 'HAS_ADDON') {
          matchesAddon = Boolean(it.toppings && it.toppings.length > 0);
        } else if (selectedAddon !== 'ALL') {
          matchesAddon = Boolean(
            it.toppings?.some((top) => top.topping_name === selectedAddon)
          );
        }

        if (matchesSize && matchesFlavor && matchesAddon) {
          map[o.order_date].bowls += 1;
          const itemRev =
            it.price + (it.toppings?.reduce((acc, t) => acc + t.price, 0) || 0);
          map[o.order_date].revenue += itemRev;
        }
      });
    });

    return Object.entries(map).map(([date, val]) => ({
      date: date.slice(5), // MM-DD
      fullDate: date,
      revenue: val.revenue,
      bowls: val.bowls,
    }));
  }, [validOrders, dateRange, selectedBowlSize, selectedFlavor, selectedAddon]);

  // 5. Highest Flavor Bowl Sold (Tabular Form, Descending Order)
  const topFlavorsTableData = useMemo<TopFlavorRow[]>(() => {
    const aggMap: Record<
      string,
      { flavor: string; sizeName: string; sizeCode: string; bowlsSold: number; revenue: number }
    > = {};

    validOrders.forEach((o) => {
      o.items?.forEach((it) => {
        const key = `${it.flavor_name}__${it.size_code || it.size_name}`;
        if (!aggMap[key]) {
          aggMap[key] = {
            flavor: it.flavor_name,
            sizeName: it.size_name,
            sizeCode: it.size_code || 'KB',
            bowlsSold: 0,
            revenue: 0,
          };
        }
        aggMap[key].bowlsSold += 1;
        const itemRev =
          it.price + (it.toppings?.reduce((acc, t) => acc + t.price, 0) || 0);
        aggMap[key].revenue += itemRev;
      });
    });

    // Sort descending by bowlsSold
    const sorted = Object.entries(aggMap)
      .map(([key, val]) => ({
        key,
        ...val,
      }))
      .sort((a, b) => b.bowlsSold - a.bowlsSold);

    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      sharePercent:
        totalBowlsSold > 0 ? Number(((item.bowlsSold / totalBowlsSold) * 100).toFixed(1)) : 0,
    }));
  }, [validOrders, totalBowlsSold]);

  // Table Columns Definition
  const tableColumns: ColumnsType<TopFlavorRow> = [
    {
      title: '#',
      dataIndex: 'rank',
      key: 'rank',
      width: 46,
      render: (r: number) => (
        <span style={{ fontWeight: 800, color: r <= 3 ? 'var(--primary-burgundy)' : 'var(--text-muted)' }}>
          {r}
        </span>
      ),
    },
    {
      title: 'Flavor & Size',
      key: 'flavor_size',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{record.flavor}</div>
          <Tag style={{ fontSize: 11, padding: '0 5px', marginTop: 2 }}>
            {record.sizeName} [{record.sizeCode}]
          </Tag>
        </div>
      ),
    },
    {
      title: 'Sold',
      dataIndex: 'bowlsSold',
      key: 'bowlsSold',
      width: 70,
      align: 'right',
      sorter: (a, b) => a.bowlsSold - b.bowlsSold,
      defaultSortOrder: 'descend',
      render: (val: number) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13 }}>
          {val}
        </span>
      ),
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 95,
      align: 'right',
      sorter: (a, b) => a.revenue - b.revenue,
      render: (val: number) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-burgundy)' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      title: 'Share',
      dataIndex: 'sharePercent',
      key: 'sharePercent',
      width: 70,
      align: 'right',
      render: (val: number) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {val}%
        </span>
      ),
    },
  ];

  return (
    <div className="fc-filter-trend-section">
      {/* LEFT COLUMN: Dual Filter Controls + Dynamic Graph */}
      <div className="fc-filter-trend-left">
        {/* Filter Bar Box */}
        <div className="fc-filter-panel">
          <div className="fc-filter-row">
            <span className="fc-filter-title">BOWL SIZE FILTER:</span>
            <div className="fc-pill-group">
              <button
                type="button"
                className={`fc-filter-pill ${selectedBowlSize === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedBowlSize('ALL')}
              >
                All ({totalBowlsSold})
              </button>
              <button
                type="button"
                className={`fc-filter-pill ${selectedBowlSize === 'B' ? 'active' : ''}`}
                onClick={() => setSelectedBowlSize('B')}
              >
                Bite [B] ({bowlCounts.B})
              </button>
              <button
                type="button"
                className={`fc-filter-pill ${selectedBowlSize === 'KB' ? 'active' : ''}`}
                onClick={() => setSelectedBowlSize('KB')}
              >
                KiloBite [KB] ({bowlCounts.KB})
              </button>
              <button
                type="button"
                className={`fc-filter-pill ${selectedBowlSize === 'MB' ? 'active' : ''}`}
                onClick={() => setSelectedBowlSize('MB')}
              >
                MegaBite [MB] ({bowlCounts.MB})
              </button>
              <button
                type="button"
                className={`fc-filter-pill ${selectedBowlSize === 'GB' ? 'active' : ''}`}
                onClick={() => setSelectedBowlSize('GB')}
              >
                GigaBite [GB] ({bowlCounts.GB})
              </button>
            </div>
          </div>

          <div className="fc-filter-row" style={{ marginTop: 10 }}>
            <span className="fc-filter-title">FLAVOR & ADDONS:</span>
            <div className="fc-pill-group">
              <button
                type="button"
                className={`fc-filter-pill ${selectedFlavor === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedFlavor('ALL')}
              >
                All Flavors
              </button>
              <button
                type="button"
                className={`fc-filter-pill ${selectedFlavor === 'Spicy Chipotle' ? 'active' : ''}`}
                onClick={() => setSelectedFlavor('Spicy Chipotle')}
              >
                Spicy Chipotle ({flavorCounts['Spicy Chipotle']})
              </button>
              <button
                type="button"
                className={`fc-filter-pill ${selectedFlavor === 'Chilly Cheese' ? 'active' : ''}`}
                onClick={() => setSelectedFlavor('Chilly Cheese')}
              >
                Chilly Cheese ({flavorCounts['Chilly Cheese']})
              </button>
              <button
                type="button"
                className={`fc-filter-pill ${selectedFlavor === 'Cheese Peri Peri' ? 'active' : ''}`}
                onClick={() => setSelectedFlavor('Cheese Peri Peri')}
              >
                Cheese Peri Peri ({flavorCounts['Cheese Peri Peri']})
              </button>
              <button
                type="button"
                className={`fc-filter-pill ${selectedFlavor === 'Korean BBQ' ? 'active' : ''}`}
                onClick={() => setSelectedFlavor('Korean BBQ')}
              >
                Korean BBQ ({flavorCounts['Korean BBQ']})
              </button>
            </div>

            {/* Addon Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                Addon Filter:
              </span>
              <Select
                value={selectedAddon}
                onChange={setSelectedAddon}
                size="small"
                style={{ width: 190 }}
                options={[
                  { value: 'ALL', label: 'All (Include Addons)' },
                  { value: 'HAS_ADDON', label: 'Any Addon Only' },
                  { value: 'Nachos', label: `Nachos (${addonCounts['Nachos']})` },
                  { value: 'Extra Cheese', label: `Extra Cheese (${addonCounts['Extra Cheese']})` },
                  { value: 'Kurkure', label: `Kurkure (${addonCounts['Kurkure']})` },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Filtered Graph Card */}
        <div className="fc-chart-box">
          <div className="fc-chart-box-header">
            <div>
              <h3 className="fc-chart-box-title">
                Filtered Sales Performance Trend
              </h3>
              <span className="fc-chart-box-sub">
                Timeline dynamic response • Size: {selectedBowlSize} • Flavor: {selectedFlavor} • Addon: {selectedAddon}
              </span>
            </div>

            <Radio.Group
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="revenue">Revenue (INR)</Radio.Button>
              <Radio.Button value="bowls">Bowls Sold (#)</Radio.Button>
            </Radio.Group>
          </div>

          <div style={{ width: '100%', height: 260, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredTrendData} margin={{ top: 12, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 140, 140, 0.15)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8C8C8C" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#8C8C8C" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => (metric === 'revenue' ? `Rs ${val}` : `${val}`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="fc-chart-tooltip">
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#FFFFFF', marginBottom: 4 }}>{dataPoint.fullDate}</div>
                          <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 2 }}>
                            Bowls Sold: <b style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{dataPoint.bowls}</b>
                          </div>
                          <div style={{ fontSize: 12, color: '#CBD5E1' }}>
                            Filtered Revenue: <b style={{ color: '#FCD34D', fontFamily: 'var(--font-mono)' }}>{formatINR(dataPoint.revenue)}</b>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="#5C1D24"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#5C1D24', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#5C1D24', stroke: '#FCD34D', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Highest Flavor Bowl Sold (Tabular Form, Descending Order) */}
      <div className="fc-filter-trend-right">
        <div className="fc-table-box">
          <div className="fc-table-box-header">
            <div>
              <h3 className="fc-chart-box-title">Highest Flavor Bowl Sold</h3>
              <span className="fc-chart-box-sub">
                Descending order by units sold • All sizes & menu items
              </span>
            </div>
            <Tag color="burgundy" style={{ fontWeight: 700, margin: 0 }}>
              {topFlavorsTableData.length} COMBINATIONS
            </Tag>
          </div>

          <div style={{ marginTop: 12 }}>
            <Table
              dataSource={topFlavorsTableData}
              columns={tableColumns}
              pagination={{ pageSize: 6, size: 'small', showSizeChanger: false }}
              size="middle"
              bordered={false}
              className="fc-top-flavor-table"
              scroll={{ x: 'max-content' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
