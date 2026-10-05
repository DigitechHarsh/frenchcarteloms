import React, { useState, useMemo } from 'react';
import { 
  Tabs, 
  Table, 
  Button, 
  Input, 
  InputNumber, 
  Switch, 
  Tag, 
  Modal, 
  Form, 
  Select, 
  message, 
  Card, 
  Row, 
  Col, 
  Space, 
  DatePicker,
  Popconfirm,
  Divider,
  Radio
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient } from '../../lib/supabase';
import { MenuItem, Order } from '../../types';
import { formatINR } from '../../lib/formatters';

const { TabPane } = Tabs;

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Menu Items State & Queries
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => apiClient.getMenuItems(),
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm] = Form.useForm();

  // Order Correction State
  const [correctionOrderId, setCorrectionOrderId] = useState<string>('');
  const [correctionTargetStatus, setCorrectionTargetStatus] = useState<Order['status']>('new');
  const [auditNote, setAuditNote] = useState<string>('');

  // Data Tools
  const [archiveDate, setArchiveDate] = useState<dayjs.Dayjs | null>(dayjs().subtract(30, 'day'));

  // Save / Update Menu Item Mutation
  const saveMenuItemMutation = useMutation({
    mutationFn: async (item: MenuItem) => {
      await apiClient.updateMenuItem(item);
    },
    onSuccess: () => {
      message.success('Menu item saved successfully');
      setIsAddModalOpen(false);
      setEditingItem(null);
      menuForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    menuForm.setFieldsValue(item);
    setIsAddModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    menuForm.resetFields();
    menuForm.setFieldsValue({
      type: 'flavor',
      price: 0,
      is_active: true,
      sort_order: menuItems.length + 1,
    });
    setIsAddModalOpen(true);
  };

  const handleToggleActive = (item: MenuItem, active: boolean) => {
    saveMenuItemMutation.mutate({ ...item, is_active: active });
  };

  const onSaveMenuForm = async () => {
    try {
      const values = await menuForm.validateFields();
      const payload: MenuItem = {
        id: editingItem ? editingItem.id : `custom-${Date.now()}`,
        ...values,
      };
      saveMenuItemMutation.mutate(payload);
    } catch {
      // validation error
    }
  };

  // Filtered menu items by category tab
  const filteredMenuItems = useMemo(() => {
    if (categoryFilter === 'all') return menuItems;
    return menuItems.filter((item) => item.type === categoryFilter);
  }, [menuItems, categoryFilter]);

  // Order Correction
  const handleOrderCorrection = async () => {
    if (!correctionOrderId) {
      message.warning('Please enter an Order ID or Token #');
      return;
    }
    const allOrders = await apiClient.getOrders();
    const target = allOrders.find(
      (o) => o.id === correctionOrderId || String(o.token_number) === correctionOrderId.replace('#', '')
    );
    if (!target) {
      message.error(`Order "${correctionOrderId}" not found`);
      return;
    }

    await apiClient.updateOrderStatus(
      target.id,
      correctionTargetStatus,
      undefined,
      auditNote.trim() || 'Corrected via Admin Panel'
    );
    message.success(`Order #${target.token_number} status updated to ${correctionTargetStatus.toUpperCase()}`);
    setCorrectionOrderId('');
    setAuditNote('');
    queryClient.invalidateQueries({ queryKey: ['all-dashboard-orders'] });
    queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
  };

  // Data Tools: Archive & Clean
  const handleArchiveExport = async () => {
    if (!archiveDate) return;
    const cutoff = archiveDate.format('YYYY-MM-DD');
    const allOrders = await apiClient.getOrders();
    const oldOrders = allOrders.filter((o) => o.order_date <= cutoff);

    if (oldOrders.length === 0) {
      message.info(`No orders found older than ${cutoff}`);
      return;
    }

    let csvContent = 'ID,Token,Date,Customer,Status,Payment,Amount,Created_At\n';
    oldOrders.forEach((o) => {
      csvContent += `"${o.id}",${o.token_number},"${o.order_date}","${o.customer_name || ''}","${o.status}","${o.payment_type}",${o.total_amount},"${o.created_at}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `archived_orders_up_to_${cutoff}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Exported ${oldOrders.length} orders to CSV`);
  };

  // Re-generate Demo Data
  const handleRegenerateDemoData = async () => {
    await apiClient.generateFreshDemoData(30);
    message.success('Generated 30 days of demo orders');
    queryClient.invalidateQueries();
  };

  // Clear Demo Data
  const handleClearDemoData = async () => {
    await apiClient.clearDemoData();
    message.success('Demo seed orders removed from database');
    queryClient.invalidateQueries();
  };

  // Category labels helper
  const categoryLabels: Record<string, string> = {
    size: 'Bowl Size',
    flavor: 'Flavor',
    topping: 'Add-on',
  };

  // Clean, Simple Menu Table Columns (No icons)
  const menuColumns = [
    {
      title: 'Category',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (val: string) => (
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-dark)' }}>
          {categoryLabels[val] || val}
        </span>
      ),
    },
    { 
      title: 'Item Name', 
      dataIndex: 'name', 
      key: 'name', 
      render: (val: string) => <span style={{ fontWeight: 700 }}>{val}</span> 
    },
    { 
      title: 'Code', 
      dataIndex: 'short_code', 
      key: 'short_code',
      width: 90,
      render: (val: string) => <span style={{ color: 'var(--text-muted)' }}>{val || '-'}</span> 
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      render: (val: number) => (
        <span style={{ fontWeight: 700, color: val > 0 ? 'var(--primary-burgundy)' : 'var(--text-muted)' }}>
          {val > 0 ? formatINR(val) : 'Included'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (val: boolean, r: MenuItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            checked={val}
            onChange={(checked) => handleToggleActive(r, checked)}
            size="small"
          />
          <span style={{ fontSize: 12, color: val ? 'var(--primary-burgundy)' : 'var(--text-muted)' }}>
            {val ? 'Active' : 'Hidden'}
          </span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: any, r: MenuItem) => (
        <Button
          size="small"
          onClick={() => handleEditItem(r)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="fc-admin-wrapper">
      <div className="fc-admin-header" style={{ marginBottom: 18 }}>
        <h1 className="fc-page-title" style={{ margin: 0 }}>System Administration</h1>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Manage menu catalog, pricing, operational PINs, and database maintenance
        </span>
      </div>

      <Tabs defaultActiveKey="menu" size="middle" className="fc-admin-tabs">
        {/* TAB 1: MENU CATALOG & PRICING */}
        <TabPane tab="Menu Catalog" key="menu">
          <Card className="fc-admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>French Cartel Menu Catalog</h2>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  All pricing updates apply immediately across Cashier POS and Kitchen display
                </span>
              </div>
              <Button
                type="primary"
                onClick={handleAddNew}
              >
                Add Menu Item
              </Button>
            </div>

            {/* Simple Category Filter Filter */}
            <div style={{ marginBottom: 14 }}>
              <Radio.Group
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="all">All Items ({menuItems.length})</Radio.Button>
                <Radio.Button value="size">Bowl Sizes</Radio.Button>
                <Radio.Button value="flavor">Flavors</Radio.Button>
                <Radio.Button value="topping">Add-ons</Radio.Button>
              </Radio.Group>
            </div>

            {/* Clean Simple Table (No Icons) */}
            <Table
              dataSource={filteredMenuItems}
              columns={menuColumns as any}
              rowKey="id"
              pagination={false}
              size="middle"
              bordered
              scroll={{ x: 600 }}
            />
          </Card>
        </TabPane>

        {/* TAB 2: ORDER CORRECTIONS */}
        <TabPane tab="Order Corrections" key="corrections">
          <Card className="fc-admin-card" style={{ maxWidth: 600 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Reopen or Revert Order Status</h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 16 }}>
              Correct human mistakes, accidental status moves, or customer cancellations
            </span>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Order ID or Token Number:
                </label>
                <Input
                  placeholder="e.g. 14"
                  value={correctionOrderId}
                  onChange={(e) => setCorrectionOrderId(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Target New Status:
                </label>
                <Select
                  value={correctionTargetStatus}
                  onChange={(val) => setCorrectionTargetStatus(val)}
                  style={{ width: '100%' }}
                  options={[
                    { label: 'New (Send back to queue)', value: 'new' },
                    { label: 'Preparing (Reopen in kitchen)', value: 'preparing' },
                    { label: 'Ready (Mark ready for pickup)', value: 'ready' },
                    { label: 'Completed (Mark served)', value: 'completed' },
                    { label: 'Cancelled (Drop order)', value: 'cancelled' },
                  ]}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                  Audit Reason:
                </label>
                <Input.TextArea
                  placeholder="Reason for changing status..."
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                type="primary"
                onClick={handleOrderCorrection}
              >
                Apply Correction
              </Button>
            </Space>
          </Card>
        </TabPane>

        {/* TAB 4: DATA MANAGEMENT */}
        <TabPane tab="Data Management" key="data">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card className="fc-admin-card" title="Archive & Export Old Orders">
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 14 }}>
                  Export orders older than a specified date to CSV for external records.
                </span>

                <div style={{ marginBottom: 14 }}>
                  <DatePicker
                    value={archiveDate}
                    onChange={(d) => setArchiveDate(d)}
                    style={{ width: '100%' }}
                  />
                </div>

                <Button
                  type="primary"
                  onClick={handleArchiveExport}
                  block
                >
                  Export Selected Orders to CSV
                </Button>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card className="fc-admin-card" title="Demo Data Tools">
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 14 }}>
                  Populate or clear 30 days of realistic orders for local testing.
                </span>

                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    onClick={handleRegenerateDemoData}
                    block
                  >
                    Regenerate 30 Days Demo Orders
                  </Button>

                  <Popconfirm
                    title="Clear Demo Orders"
                    description="This will remove all demo seed orders from the system."
                    onConfirm={handleClearDemoData}
                  >
                    <Button danger block>
                      Clear Demo Orders
                    </Button>
                  </Popconfirm>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Modal for Adding / Editing Menu Item (No Icons) */}
      <Modal
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        open={isAddModalOpen}
        onCancel={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onOk={onSaveMenuForm}
        okText="Save Item"
        centered
        width={420}
      >
        <Form form={menuForm} layout="vertical">
          <Form.Item label="Item Category" name="type" required>
            <Select
              options={[
                { label: 'Bowl Size', value: 'size' },
                { label: 'Flavor', value: 'flavor' },
                { label: 'Add-on', value: 'topping' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Item Name" name="name" required>
            <Input placeholder="e.g. Truffle Mayo" />
          </Form.Item>

          <Form.Item label="Short Code" name="short_code">
            <Input placeholder="e.g. TM" />
          </Form.Item>

          <Form.Item label="Price (INR)" name="price" required>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Active on Menu" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
