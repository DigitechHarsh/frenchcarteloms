import React from 'react';
import { 
  Button, 
  Input, 
  Switch, 
  Segmented, 
  Tag, 
  Empty, 
  Divider, 
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  MinusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  ThunderboltOutlined, 
  DollarOutlined, 
  QrcodeOutlined, 
  CreditCardOutlined,
  CopyOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/useCartStore';
import { formatINR } from '../../lib/formatters';
import type { MenuItem, PaymentMethod } from '../../types';

interface CartSectionProps {
  menuItems: MenuItem[];
  onPlaceOrder: () => void;
  isPlacing: boolean;
}

export const CartSection: React.FC<CartSectionProps> = ({
  menuItems,
  onPlaceOrder,
  isPlacing,
}) => {
  const {
    bowls,
    lastAddedBowl,
    customerName,
    notes,
    isPriority,
    paymentType,
    isPaid,
    repeatLastBowl,
    updateQuantity,
    removeBowl,
    editBowl,
    clearCart,
    setCustomerName,
    setNotes,
    setIsPriority,
    setPaymentType,
    setIsPaid,
    getTotalCartAmount,
    getTotalBowlsCount,
  } = useCartStore();

  const totalAmount = getTotalCartAmount();
  const totalBowls = getTotalBowlsCount();

  return (
    <div className="fc-cart-panel">
      {/* Header */}
      <div className="fc-cart-header">
        <div className="fc-cart-title-row">
          <ShoppingOutlined style={{ fontSize: 22, color: '#E65100' }} />
          <h2 className="fc-cart-heading">Current Order</h2>
          {bowls.length > 0 && (
            <Tag color="orange" style={{ fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>
              {totalBowls} {totalBowls === 1 ? 'Bowl' : 'Bowls'}
            </Tag>
          )}
        </div>

        {lastAddedBowl && (
          <Button
            type="dashed"
            icon={<CopyOutlined />}
            size="middle"
            onClick={repeatLastBowl}
            className="fc-repeat-btn"
          >
            Same as last bowl (+{formatINR(lastAddedBowl.bowl_unit_price)})
          </Button>
        )}
      </div>

      {/* Cart Bowls List */}
      <div className="fc-cart-items-container">
        {bowls.length === 0 ? (
          <div className="fc-cart-empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ fontSize: 14, color: '#8C8C8C' }}>
                  No bowls added yet.<br />Choose size and flavor to begin!
                </span>
              }
            />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {bowls.map((bowl) => (
              <motion.div
                key={bowl.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="fc-cart-item-card"
              >
                <div className="fc-cart-item-main">
                  <div className="fc-cart-item-header">
                    <span className="fc-cart-bowl-title">
                      <Tag color="#E65100" style={{ fontWeight: 800, marginRight: 6 }}>
                        {bowl.size_code}
                      </Tag>
                      {bowl.size_name} Fries
                    </span>
                    <span className="fc-cart-bowl-price">
                      {formatINR(bowl.bowl_unit_price * bowl.quantity)}
                    </span>
                  </div>

                  <div className="fc-cart-bowl-flavor">
                    🔥 <b>Flavor:</b> {bowl.flavor_name}
                  </div>

                  {bowl.toppings.length > 0 && (
                    <div className="fc-cart-bowl-toppings">
                      🧀 <b>Toppings:</b>{' '}
                      {bowl.toppings.map((t) => `${t.topping_name} (+${formatINR(t.price)})`).join(', ')}
                    </div>
                  )}

                  {/* Quantity Stepper & Actions */}
                  <div className="fc-cart-item-footer">
                    <div className="fc-qty-stepper">
                      <Button
                        shape="circle"
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => updateQuantity(bowl.id, -1)}
                      />
                      <span className="fc-qty-val">{bowl.quantity}</span>
                      <Button
                        shape="circle"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => updateQuantity(bowl.id, 1)}
                      />
                    </div>

                    <div className="fc-item-actions">
                      <Tooltip title="Edit bowl recipe">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => editBowl(bowl, menuItems)}
                        />
                      </Tooltip>
                      <Tooltip title="Remove bowl">
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeBowl(bowl.id)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Cart Meta & Checkout Inputs */}
      {bowls.length > 0 && (
        <div className="fc-cart-checkout-section">
          <Divider style={{ margin: '12px 0' }} />

          {/* Customer Name & Notes */}
          <div className="fc-input-row">
            <Input
              placeholder="Customer Name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              size="large"
              style={{ flex: 1 }}
              maxLength={40}
            />
          </div>

          <Input
            placeholder="Special Kitchen Note (e.g. less spicy, extra crisp)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            size="middle"
            style={{ marginTop: 8 }}
            maxLength={100}
          />

          {/* Payment Type & Paid Toggle */}
          <div className="fc-payment-row" style={{ marginTop: 12 }}>
            <Segmented<PaymentMethod>
              value={paymentType}
              onChange={(val) => setPaymentType(val)}
              block
              size="large"
              options={[
                { label: 'UPI', value: 'upi', icon: <QrcodeOutlined /> },
                { label: 'Cash', value: 'cash', icon: <DollarOutlined /> },
                { label: 'Card', value: 'card', icon: <CreditCardOutlined /> },
              ]}
            />
          </div>

          <div className="fc-paid-status-row" style={{ marginTop: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Payment Received:</span>
            <Segmented
              value={isPaid ? 'PAID' : 'UNPAID'}
              onChange={(val) => setIsPaid(val === 'PAID')}
              options={[
                { label: 'PAID', value: 'PAID', className: 'fc-paid-option' },
                { label: 'UNPAID', value: 'UNPAID', className: 'fc-unpaid-option' },
              ]}
            />
          </div>

          {/* Running Animated Total */}
          <div className="fc-cart-total-banner">
            <span className="fc-total-label">Total Payable</span>
            <motion.span
              key={totalAmount}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="fc-total-amount"
            >
              {formatINR(totalAmount)}
            </motion.span>
          </div>

          {/* Place Order Action */}
          <div className="fc-cart-buttons-row">
            <Button
              danger
              type="text"
              onClick={clearCart}
              disabled={isPlacing}
              size="large"
              style={{ width: '30%' }}
            >
              Clear
            </Button>
            <Button
              type="primary"
              size="large"
              loading={isPlacing}
              onClick={onPlaceOrder}
              className="fc-place-order-btn"
              style={{ width: '70%', height: 56, fontSize: 18, fontWeight: 800 }}
            >
              Place Order ➔
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
