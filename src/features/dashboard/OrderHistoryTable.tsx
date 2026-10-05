import React, { useRef, useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule, RowClickedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Input, Button, Tag, Space } from 'antd';
import { Order } from '../../types';
import { formatINR, formatKolkataDateTime } from '../../lib/formatters';
import { useSettingsStore } from '../../store/useSettingsStore';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface OrderHistoryTableProps {
  orders: Order[];
  onRowClick: (order: Order) => void;
  activeFilter: { label: string; value: string; type: string } | null;
  onClearFilter: () => void;
}

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  orders,
  onRowClick,
  activeFilter,
  onClearFilter,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState<string>('');
  const { isDarkMode } = useSettingsStore();

  // Column Definitions
  const colDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'Token #',
      field: 'token_number',
      width: 110,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <span>#{params.value}</span>
          </div>
        );
      },
    },
    {
      headerName: 'Date & Time',
      field: 'created_at',
      width: 170,
      sortable: true,
      filter: true,
      valueFormatter: (params) => formatKolkataDateTime(params.value),
    },
    {
      headerName: 'Customer',
      field: 'customer_name',
      width: 140,
      sortable: true,
      filter: true,
      valueFormatter: (params) => params.value || 'Walk-in',
    },
    {
      headerName: 'Bowls Ordered',
      field: 'items_summary',
      flex: 2,
      minWidth: 220,
      valueGetter: (params) => {
        return params.data?.items
          ?.map((it: any) => `[${it.size_code}] ${it.flavor_name}`)
          .join(', ') || '-';
      },
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 130,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const statusColors: Record<string, string> = {
          new: 'blue',
          preparing: 'orange',
          ready: 'green',
          completed: 'default',
          cancelled: 'error',
        };
        const color = statusColors[params.value] || 'default';
        return (
          <Tag color={color} style={{ fontWeight: 700, textTransform: 'uppercase' }}>
            {params.value}
          </Tag>
        );
      },
    },
    {
      headerName: 'Payment',
      field: 'payment_type',
      width: 140,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const isPaid = params.data?.is_paid;
        return (
          <Tag color={isPaid ? 'green' : 'red'}>
            {params.value?.toUpperCase()} • {isPaid ? 'PAID' : 'UNPAID'}
          </Tag>
        );
      },
    },
    {
      headerName: 'Total (INR)',
      field: 'total_amount',
      width: 130,
      sortable: true,
      filter: true,
      valueFormatter: (params) => formatINR(params.value),
      cellStyle: { fontWeight: 700, color: '#E65100' },
    },
  ], []);

  // Filter orders according to active chart filter click
  const filteredOrders = useMemo(() => {
    if (!activeFilter) return orders;

    return orders.filter((order) => {
      if (activeFilter.type === 'date') {
        return order.order_date === activeFilter.value;
      }
      if (activeFilter.type === 'hour') {
        const hourNum = new Date(order.created_at).getHours();
        const hourLabel = hourNum === 12 ? '12 PM' : `${hourNum > 12 ? hourNum - 12 : hourNum} ${hourNum >= 12 ? 'PM' : 'AM'}`;
        return hourLabel === activeFilter.value;
      }
      if (activeFilter.type === 'heatmap') {
        const [targetDay, targetHour] = activeFilter.value.split('-');
        const dateObj = new Date(order.created_at);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[dateObj.getDay()] === targetDay && dateObj.getHours() === Number(targetHour);
      }
      if (activeFilter.type === 'size') {
        return order.items?.some((it) => it.size_name === activeFilter.value);
      }
      if (activeFilter.type === 'flavor') {
        return order.items?.some((it) => it.flavor_name === activeFilter.value);
      }
      if (activeFilter.type === 'topping') {
        return order.items?.some((it) =>
          it.toppings?.some((t) => t.topping_name === activeFilter.value)
        );
      }
      if (activeFilter.type === 'payment') {
        return order.payment_type === activeFilter.value;
      }
      return true;
    });
  }, [orders, activeFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `french_cartel_orders_${new Date().toISOString().slice(0, 10)}.csv`,
    });
  };

  // Download Daily Report summary
  const handleDownloadDailyReport = () => {
    const totalOrders = filteredOrders.length;
    const totalRev = filteredOrders.reduce((acc, o) => acc + o.total_amount, 0);
    const paidOrders = filteredOrders.filter((o) => o.is_paid).length;
    
    let reportText = `FRENCH CARTEL - DAILY SALES SUMMARY REPORT\n`;
    reportText += `Generated on: ${new Date().toLocaleString()}\n`;
    reportText += `Total Orders: ${totalOrders}\n`;
    reportText += `Total Revenue: Rs ${totalRev}\n`;
    reportText += `Paid Orders: ${paidOrders} / ${totalOrders}\n`;
    reportText += `---------------------------------------------------\n\n`;
    reportText += `TOKEN | TIME | CUSTOMER | STATUS | PAYMENT | AMOUNT | BOWLS\n`;

    filteredOrders.forEach((o) => {
      const itemsStr = o.items?.map((it) => `${it.size_code}-${it.flavor_name}`).join('; ');
      reportText += `#${o.token_number} | ${formatKolkataDateTime(o.created_at)} | ${o.customer_name || 'Walk-in'} | ${o.status} | ${o.payment_type} | Rs ${o.total_amount} | ${itemsStr}\n`;
    });

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `french_cartel_daily_report_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onRowClicked = (event: RowClickedEvent) => {
    if (event.data) {
      onRowClick(event.data as Order);
    }
  };

  return (
    <div className="fc-aggrid-wrapper">
      {/* Table Toolbar */}
      <div className="fc-grid-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="Search token, customer, status..."
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            style={{ width: 280 }}
            size="middle"
            allowClear
          />

          {activeFilter && (
            <Tag
              color="orange"
              closable
              onClose={onClearFilter}
              style={{ fontSize: 13, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Filtered by {activeFilter.label}: <b>{activeFilter.value}</b>
            </Tag>
          )}
        </div>

        <Space>
          <Button onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            type="primary"
            onClick={handleDownloadDailyReport}
          >
            Download Daily Report
          </Button>
        </Space>
      </div>

      {/* AG Grid Component */}
      <div 
        className={isDarkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'} 
        style={{ height: 480, width: '100%', borderRadius: 12, overflow: 'hidden' }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={filteredOrders}
          columnDefs={colDefs}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={15}
          paginationPageSizeSelector={[15, 30, 50, 100]}
          rowSelection={{ mode: 'singleRow' }}
          onRowClicked={onRowClicked}
          defaultColDef={{
            resizable: true,
          }}
        />
      </div>
    </div>
  );
};
