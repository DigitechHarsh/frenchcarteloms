import React, { useState, useMemo } from 'react';
import { 
  Button, 
  message, 
  Tag, 
  Input, 
  Segmented,
  Select
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient } from '../../lib/supabase';
import { formatINR, getKolkataDateString, formatKolkataTime } from '../../lib/formatters';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import type { Order, FreeToppingChoice, PaymentMethod, CartBowl, BowlTopping } from '../../types';

// Fixed French Cartel Flavors & Bowl Sizes
const FLAVOR_OPTIONS = [
  { value: 'Spicy Chipotle', label: 'Spicy Chipotle', hint: 'Smoked Paprika & Chipotle' },
  { value: 'Chilly Cheese', label: 'Chilly Cheese', hint: 'Melted Cheddar & Chilly' },
  { value: 'Cheese Peri Peri', label: 'Cheese Peri Peri', hint: 'Tangy Peri Peri & Cheddar' },
  { value: 'Korean BBQ', label: 'Korean BBQ', hint: 'Sweet Savory BBQ Glaze' },
];

const SIZE_OPTIONS = [
  { value: 'B', name: 'Bite', price: 169, label: '[B] Bite — ₹169' },
  { value: 'KB', name: 'KiloBite', price: 279, label: '[KB] KiloBite — ₹279' },
  { value: 'MB', name: 'MegaBite', price: 329, label: '[MB] MegaBite — ₹329' },
  { value: 'GB', name: 'GigaBite', price: 389, label: '[GB] GigaBite — ₹389' },
];


const PAID_TOPPING_OPTIONS = [
  { value: 'Nachos', label: 'Nachos (+₹60)', price: 60, id: 'top-nachos' },
  { value: 'Extra Cheese', label: 'Extra Cheese (+₹30)', price: 30, id: 'top-extra-cheese' },
  { value: 'Kurkure', label: 'Kurkure (+₹40)', price: 40, id: 'top-kurkure' },
];

export const OrderPage: React.FC = () => {
  const queryClient = useQueryClient();
  const todayStr = getKolkataDateString();

  // Mobile View Toggle: 'form' vs 'queue' (for phones/small tablets)
  const [mobileView, setMobileView] = useState<'form' | 'queue'>('form');

  // 1. Customer & Order Info
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentType, setPaymentType] = useState<PaymentMethod>('upi');

  // 2. Multiple Bowls in current order ticket
  const [ticketBowls, setTicketBowls] = useState<CartBowl[]>([]);

  // 3. 1-Tap Touch Builder State
  const [selectedSizeCode, setSelectedSizeCode] = useState<string>('KB'); // Default KiloBite
  const [selectedFlavorName, setSelectedFlavorName] = useState<string>('Spicy Chipotle');
  const [selectedPaidToppings, setSelectedPaidToppings] = useState<string[]>([]);
  const [builderQuantity, setBuilderQuantity] = useState<number>(1);

  // Confirmation Modal
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // 4. Queue filter & search
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch today's orders
  const { data: todayOrders = [] } = useQuery({
    queryKey: ['orders', todayStr],
    queryFn: () => apiClient.getOrders(todayStr),
    refetchInterval: 5000,
  });

  // Calculate next token
  const nextToken = useMemo(() => {
    return todayOrders.length > 0 ? Math.max(...todayOrders.map((o) => o.token_number)) + 1 : 1;
  }, [todayOrders]);

  // Selected Size Object
  const currentSizeObj = SIZE_OPTIONS.find((s) => s.value === selectedSizeCode) || SIZE_OPTIONS[1];

  // Current single bowl unit price
  const currentBowlUnitPrice = useMemo(() => {
    const toppingsCost = selectedPaidToppings.reduce((acc, topName) => {
      const found = PAID_TOPPING_OPTIONS.find((p) => p.value === topName);
      return acc + (found?.price || 0);
    }, 0);
    return currentSizeObj.price + toppingsCost;
  }, [currentSizeObj, selectedPaidToppings]);

  // Add configured bowl to ticket
  const handleAddBowlToTicket = () => {
    const toppingsList: BowlTopping[] = selectedPaidToppings.map((topName) => {
      const found = PAID_TOPPING_OPTIONS.find((p) => p.value === topName);
      return {
        topping_id: found?.id || `top-${topName}`,
        topping_name: topName,
        price: found?.price || 0,
      };
    });

    const newBowl: CartBowl = {
      id: 'bowl-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      size_id: `size-${currentSizeObj.value.toLowerCase()}`,
      size_name: currentSizeObj.name,
      size_code: currentSizeObj.value,
      flavor_id: `flavor-${selectedFlavorName.toLowerCase().replace(/\s+/g, '-')}`,
      flavor_name: selectedFlavorName,
      free_topping: 'None',
      toppings: toppingsList,
      bowl_unit_price: currentBowlUnitPrice,
      quantity: builderQuantity,
    };

    setTicketBowls((prev) => [...prev, newBowl]);
    message.success(`Added ${builderQuantity}x [${currentSizeObj.value}] ${selectedFlavorName}`);

    // Reset builder for next bowl
    setBuilderQuantity(1);
    setSelectedPaidToppings([]);
  };

  // Modify quantity of item in current ticket
  const handleUpdateTicketQty = (bowlId: string, delta: number) => {
    setTicketBowls((prev) =>
      prev
        .map((b) => (b.id === bowlId ? { ...b, quantity: Math.max(1, b.quantity + delta) } : b))
        .filter((b) => b.quantity > 0)
    );
  };

  // Remove bowl from ticket
  const handleRemoveBowlFromTicket = (bowlId: string) => {
    setTicketBowls((prev) => prev.filter((b) => b.id !== bowlId));
  };

  // Reset entire form
  const handleResetForm = () => {
    setCustomerName('');
    setNotes('');
    setPaymentType('upi');
    setTicketBowls([]);
    setBuilderQuantity(1);
    setSelectedPaidToppings([]);
    message.info('Form cleared');
  };

  // Grand Total of current order
  const grandTotal = useMemo(() => {
    return ticketBowls.reduce((acc, b) => acc + b.bowl_unit_price * b.quantity, 0);
  }, [ticketBowls]);

  const totalBowlsCount = useMemo(() => {
    return ticketBowls.reduce((acc, b) => acc + b.quantity, 0);
  }, [ticketBowls]);

  // Place Order Mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (ticketBowls.length === 0) {
        throw new Error('Please add at least one bowl before placing order.');
      }
      return await apiClient.placeOrder(
        {
          customer_name: customerName.trim() || undefined,
          notes: notes.trim() || undefined,
          is_priority: false,
          payment_type: paymentType,
          is_paid: true,
        },
        ticketBowls
      );
    },
    onSuccess: (newOrder) => {
      setConfirmedOrder(newOrder);
      setIsConfirmOpen(true);
      handleResetForm();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to place order.');
    },
  });

  // Filtered Orders for Queue (Strict FIFO Priority Sequence: 1, 2, 3, 4...)
  const filteredQueueOrders = useMemo(() => {
    return todayOrders
      .filter((order) => {
        const matchesStatus =
          queueStatusFilter === 'all'
            ? true
            : queueStatusFilter === 'active'
            ? order.status === 'new' || order.status === 'preparing' || order.status === 'ready'
            : order.status === queueStatusFilter;

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
          order.token_number.toString().includes(q) ||
          order.items?.some((it) => it.flavor_name.toLowerCase().includes(q));

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => a.token_number - b.token_number || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [todayOrders, queueStatusFilter, searchQuery]);

  return (
    <div className="fc-pos-workspace">
      {/* MOBILE SCREEN SWITCHER (Phones & Small Tablets) */}
      <div className="fc-mobile-pos-switcher">
        <Segmented
          options={[
            { label: `New Order (#${nextToken})`, value: 'form' },
            { label: `Queue (${todayOrders.length})`, value: 'queue' },
          ]}
          value={mobileView}
          onChange={(v) => setMobileView(v as 'form' | 'queue')}
          block
          size="middle"
        />
      </div>

      <div className="fc-pro-pos-container">
        {/* ========================================================================= */}
        {/* 1. ORDER POS BUILDER & TICKET FORM                                        */}
        {/* ========================================================================= */}
        <section className={`fc-pro-panel fc-pos-form-panel ${mobileView === 'queue' ? 'fc-mobile-hidden' : ''}`}>
          <div className="fc-pro-panel-header">
            <div>
              <h1 className="fc-pro-panel-title">Order POS</h1>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Next Token: <b>#{nextToken}</b>
              </span>
            </div>
            <Button size="small" onClick={handleResetForm} style={{ fontSize: 12 }}>
              Reset
            </Button>
          </div>

          {/* CUSTOMER & NOTES */}
          <div style={{ marginBottom: 14 }}>
            <div className="fc-customer-row">
              <Input
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={40}
                style={{ height: 38 }}
              />
              <Input
                placeholder="Special Note (e.g. extra crispy)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={80}
                style={{ height: 38 }}
              />
            </div>
          </div>

          {/* BOWL CONFIGURATION: 3 CLEAN DROPDOWNS (MAXIMUM SPACE UTILITY) */}
          <div className="fc-dropdown-builder-grid">
            {/* 1. BOWL SIZE */}
            <div>
              <span className="fc-touch-title">1. BOWL SIZE</span>
              <Select
                value={selectedSizeCode}
                onChange={setSelectedSizeCode}
                options={SIZE_OPTIONS.map((s) => ({
                  value: s.value,
                  label: s.label,
                }))}
                style={{ width: '100%', height: 38 }}
                size="middle"
              />
            </div>

            {/* 2. FLAVOR */}
            <div>
              <span className="fc-touch-title">2. FLAVOR</span>
              <Select
                value={selectedFlavorName}
                onChange={setSelectedFlavorName}
                options={FLAVOR_OPTIONS.map((f) => ({
                  value: f.value,
                  label: `${f.label} (${f.hint})`,
                }))}
                style={{ width: '100%', height: 38 }}
                size="middle"
              />
            </div>

            {/* 3. ADD-ONS */}
            <div>
              <span className="fc-touch-title">3. ADD-ONS</span>
              <Select
                mode="multiple"
                allowClear
                placeholder="Add-ons (optional)"
                value={selectedPaidToppings}
                onChange={(vals) => setSelectedPaidToppings(vals as string[])}
                options={PAID_TOPPING_OPTIONS.map((pt) => ({
                  value: pt.value,
                  label: pt.label,
                }))}
                style={{ width: '100%', minHeight: 38 }}
                size="middle"
                maxTagCount="responsive"
              />
            </div>
          </div>

          {/* 5. ADD BOWL BUTTON & QUANTITY ROW */}
          <div className="fc-touch-add-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="fc-touch-qty-btn"
                onClick={() => setBuilderQuantity(Math.max(1, builderQuantity - 1))}
              >
                -
              </button>
              <span className="fc-touch-qty-val">{builderQuantity}</span>
              <button
                type="button"
                className="fc-touch-qty-btn"
                onClick={() => setBuilderQuantity(builderQuantity + 1)}
              >
                +
              </button>
              <span className="fc-touch-item-price">
                {formatINR(currentBowlUnitPrice * builderQuantity)}
              </span>
            </div>

            <Button
              type="primary"
              size="large"
              onClick={handleAddBowlToTicket}
              className="fc-touch-add-btn"
            >
              + Add Bowl to Order
            </Button>
          </div>

          {/* 6. CURRENT ORDER TICKET SUMMARY */}
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Order Items ({totalBowlsCount} {totalBowlsCount === 1 ? 'Bowl' : 'Bowls'})
              </span>
              {ticketBowls.length > 0 && (
                <Button type="link" size="small" onClick={() => setTicketBowls([])} danger style={{ padding: 0, fontSize: 12 }}>
                  Clear All
                </Button>
              )}
            </div>

            {ticketBowls.length === 0 ? (
              <div className="fc-empty-ticket-box">
                No items added yet. Select size & flavor above and tap <b>"+ Add Bowl to Order"</b>.
              </div>
            ) : (
              <div className="fc-ticket-table-box">
                <table className="fc-pro-order-table">
                  <thead>
                    <tr>
                      <th>Bowl</th>
                      <th style={{ width: 80, textAlign: 'center' }}>Qty</th>
                      <th style={{ width: 80, textAlign: 'right' }}>Total</th>
                      <th style={{ width: 40, textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketBowls.map((bowl) => {
                      const toppingsSummary = bowl.toppings.map((t) => t.topping_name).join(', ');

                      return (
                        <tr key={bowl.id}>
                          <td>
                            <div className="fc-pro-order-item-title">
                              [{bowl.size_code}] {bowl.flavor_name}
                            </div>
                            {toppingsSummary && (
                              <div className="fc-pro-order-item-toppings">
                                + {toppingsSummary}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketQty(bowl.id, -1)}
                                className="fc-ticket-stepper-btn"
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 700, minWidth: 16 }}>{bowl.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateTicketQty(bowl.id, 1)}
                                className="fc-ticket-stepper-btn"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {formatINR(bowl.bowl_unit_price * bowl.quantity)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Button
                              type="link"
                              danger
                              size="small"
                              onClick={() => handleRemoveBowlFromTicket(bowl.id)}
                              style={{ padding: 0, fontSize: 12, fontWeight: 700 }}
                            >
                              X
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 7. PAYMENT & CHECKOUT ACTION */}
          <div className="fc-pro-checkout-card">
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                  PAYMENT METHOD
                </span>
                <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>
                  Pre-paid Counter Order
                </span>
              </div>
              <Segmented
                options={[
                  { label: 'UPI', value: 'upi' },
                  { label: 'Cash', value: 'cash' },
                  { label: 'Card', value: 'card' },
                ]}
                value={paymentType}
                onChange={(val) => setPaymentType(val as PaymentMethod)}
                block
                size="large"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {customerName.trim() || 'Walk-in'} • {totalBowlsCount} Bowls
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-burgundy)' }}>
                {formatINR(grandTotal)}
              </div>
            </div>

            <Button
              type="primary"
              block
              size="large"
              disabled={ticketBowls.length === 0}
              loading={placeOrderMutation.isPending}
              onClick={() => placeOrderMutation.mutate()}
              className="fc-place-order-btn"
            >
              {ticketBowls.length === 0
                ? 'Add Bowls to Place Order'
                : `Place Order • Token #${nextToken} (${formatINR(grandTotal)})`}
            </Button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. ORDERS QUEUE (Right Column on Desktop, Tab on Mobile)                 */}
        {/* ========================================================================= */}
        <section className={`fc-pro-panel fc-pos-queue-panel ${mobileView === 'form' ? 'fc-mobile-hidden' : ''}`}>
          <div className="fc-pro-panel-header fc-queue-header">
            <div className="fc-queue-header-left">
              <h2 className="fc-pro-panel-title">Orders Queue</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Today: {todayOrders.length} Orders
              </span>
            </div>

            <Segmented
              size="small"
              options={[
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'New', value: 'new' },
                { label: 'Prep', value: 'preparing' },
                { label: 'Ready', value: 'ready' },
              ]}
              value={queueStatusFilter}
              onChange={(val) => setQueueStatusFilter(val as string)}
              className="fc-queue-segmented"
            />
          </div>

          {/* Search */}
          <div style={{ marginBottom: 12 }}>
            <Input
              placeholder="Search by customer name or token #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ height: 38, width: '100%' }}
            />
          </div>

          {/* Row-wise Queue Table */}
          <div className="fc-pro-queue-table-wrap">
            {filteredQueueOrders.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No orders found.
              </div>
            ) : (
              <>
                {/* 1. DESKTOP / TABLET 5-COLUMN TABLE */}
                <table className="fc-pro-queue-table fc-desktop-queue-table">
                  <thead>
                    <tr>
                      <th style={{ width: 95 }}>Priority #</th>
                      <th style={{ width: 130 }}>Customer</th>
                      <th>Items Summary</th>
                      <th style={{ width: 100 }}>Amount</th>
                      <th style={{ width: 90, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueueOrders.map((order) => {
                      const isReady = order.status === 'ready';
                      const isCompleted = order.status === 'completed';
                      const isPreparing = order.status === 'preparing';
                      const elapsedMins = Math.max(1, dayjs().diff(dayjs(order.created_at), 'minute'));

                      return (
                        <tr key={order.id}>
                          <td>
                            <div className="fc-pro-row-token">
                              <span>#{order.token_number}</span>
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {formatKolkataTime(order.created_at)} ({elapsedMins}m)
                            </span>
                          </td>

                          <td>
                            <div className="fc-pro-row-name">
                              {order.customer_name || <i>Walk-in</i>}
                            </div>
                          </td>

                          <td>
                            <div className="fc-pro-row-items">
                              {order.items && order.items.length > 0 ? (
                                order.items.map((it, idx) => (
                                  <span key={idx} style={{ marginRight: 6 }}>
                                    <b>[{it.size_code}]</b> {it.flavor_name}
                                    {it.toppings && it.toppings.length > 0
                                      ? ` +${it.toppings.map((t) => t.topping_name).join(',')}`
                                      : ''}
                                    {idx < (order.items?.length || 0) - 1 ? '; ' : ''}
                                  </span>
                                ))
                              ) : (
                                <span>-</span>
                              )}
                              {order.notes && (
                                <div style={{ color: '#D97706', fontSize: 11, fontStyle: 'italic' }}>
                                  Note: {order.notes}
                                </div>
                              )}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 700 }}>{formatINR(order.total_amount)}</div>
                            <div style={{ fontSize: 10, color: '#15803D', fontWeight: 600 }}>
                              {order.payment_type.toUpperCase()} • Paid
                            </div>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <Tag
                              color={
                                isCompleted
                                  ? 'default'
                                  : isReady
                                  ? 'green'
                                  : isPreparing
                                  ? 'purple'
                                  : 'gold'
                              }
                              style={{ margin: 0, fontWeight: 700, fontSize: 10 }}
                            >
                              {order.status.toUpperCase()}
                            </Tag>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* 2. MOBILE FIXED-SIZE 3-COLUMN TABLE (Perfect Alignment on Phones) */}
                <table className="fc-pro-queue-table fc-mobile-queue-table">
                  <thead>
                    <tr>
                      <th style={{ width: '24%' }}>Priority #</th>
                      <th style={{ width: '48%' }}>Order Details</th>
                      <th style={{ width: '28%', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueueOrders.map((order) => {
                      const isReady = order.status === 'ready';
                      const isCompleted = order.status === 'completed';
                      const isPreparing = order.status === 'preparing';
                      const elapsedMins = Math.max(1, dayjs().diff(dayjs(order.created_at), 'minute'));

                      return (
                        <tr key={order.id}>
                          {/* Priority / Token */}
                          <td style={{ verticalAlign: 'top', padding: '10px 6px' }}>
                            <div className="fc-pro-row-token" style={{ fontSize: 13 }}>
                              <span>#{order.token_number}</span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                              {formatKolkataTime(order.created_at)}
                            </div>
                            <div style={{ fontSize: 10, color: '#8E7C83', fontWeight: 600 }}>
                              {elapsedMins}m ago
                            </div>
                          </td>

                          {/* Customer & Order Items */}
                          <td style={{ verticalAlign: 'top', padding: '10px 8px' }}>
                            <div className="fc-pro-row-name" style={{ fontSize: 13, marginBottom: 2 }}>
                              {order.customer_name || <i>Walk-in</i>}
                            </div>
                            <div className="fc-pro-row-items" style={{ fontSize: 11, lineHeight: 1.35 }}>
                              {order.items && order.items.length > 0 ? (
                                order.items.map((it, idx) => (
                                  <span key={idx}>
                                    <b>[{it.size_code}]</b> {it.flavor_name}
                                    {it.toppings && it.toppings.length > 0
                                      ? ` +${it.toppings.map((t) => t.topping_name).join(',')}`
                                      : ''}
                                    {idx < (order.items?.length || 0) - 1 ? '; ' : ''}
                                  </span>
                                ))
                              ) : (
                                <span>-</span>
                              )}
                              {order.notes && (
                                <div style={{ color: '#D97706', fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>
                                  Note: {order.notes}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Amount & Status */}
                          <td style={{ verticalAlign: 'top', padding: '10px 6px', textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary-burgundy)' }}>
                              {formatINR(order.total_amount)}
                            </div>
                            <div style={{ fontSize: 9, color: '#15803D', fontWeight: 700, textTransform: 'uppercase' }}>
                              {order.payment_type} • Paid
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <Tag
                                color={
                                  isCompleted
                                    ? 'default'
                                    : isReady
                                    ? 'green'
                                    : isPreparing
                                    ? 'purple'
                                    : 'gold'
                                }
                                style={{ margin: 0, fontWeight: 700, fontSize: 9, padding: '1px 5px' }}
                              >
                                {order.status.toUpperCase()}
                              </Tag>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Receipt Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        open={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setConfirmedOrder(null);
        }}
      />
    </div>
  );
};

export default OrderPage;
