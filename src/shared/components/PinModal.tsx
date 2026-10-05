import React, { useState } from 'react';
import { Modal, Typography, Button, message, Alert } from 'antd';
import { LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const PinModal: React.FC = () => {
  const { isPinModalOpen, targetRole, closePinModal, verifyPin } = useAuthStore();
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        checkPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const checkPin = (enteredPin: string) => {
    const success = verifyPin(enteredPin);
    if (success) {
      message.success(`Switched role to ${targetRole?.toUpperCase()}`);
      setPin('');
      setIsError(false);
      if (targetRole === 'kitchen') navigate('/kitchen');
      else if (targetRole === 'admin') navigate('/dashboard');
      else navigate('/order');
    } else {
      setIsError(true);
      message.error('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setPin('');
        setIsError(false);
      }, 700);
    }
  };

  const roleName = targetRole ? targetRole.charAt(0).toUpperCase() + targetRole.slice(1) : 'Role';

  return (
    <Modal
      open={isPinModalOpen}
      onCancel={() => {
        setPin('');
        setIsError(false);
        closePinModal();
      }}
      footer={null}
      centered
      width={380}
      className="fc-pin-modal"
    >
      <div style={{ textAlign: 'center', padding: '12px 8px' }}>
        <div 
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(230, 81, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#E65100',
            fontSize: 24,
          }}
        >
          <LockOutlined />
        </div>

        <Title level={4} style={{ margin: 0 }}>
          Enter {roleName} PIN
        </Title>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
          Enter your 4-digit code to access {roleName} mode
        </Text>

        {/* PIN Indicators */}
        <motion.div
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            margin: '24px 0',
          }}
        >
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '2px solid #E65100',
                background: pin.length > idx ? '#E65100' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            />
          ))}
        </motion.div>

        {/* Keypad Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            maxWidth: 280,
            margin: '0 auto',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <Button
              key={digit}
              size="large"
              style={{
                height: 58,
                fontSize: 22,
                fontWeight: 700,
                borderRadius: 14,
              }}
              onClick={() => handleDigit(digit)}
            >
              {digit}
            </Button>
          ))}
          <Button
            size="large"
            style={{ height: 58, fontSize: 14, borderRadius: 14 }}
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            key="0"
            size="large"
            style={{
              height: 58,
              fontSize: 22,
              fontWeight: 700,
              borderRadius: 14,
            }}
            onClick={() => handleDigit('0')}
          >
            0
          </Button>
          <Button
            size="large"
            icon={<DeleteOutlined />}
            style={{ height: 58, fontSize: 18, borderRadius: 14 }}
            onClick={handleDelete}
          />
        </div>

        {/* Quick Helper for Demo and Testing */}
        <div style={{ marginTop: 20 }}>
          <Alert
            type="info"
            showIcon={false}
            message={
              <span style={{ fontSize: 12 }}>
                Default PINs: <b>Cashier: 1111</b> | <b>Kitchen: 2222</b> | <b>Admin: 9999</b>
              </span>
            }
          />
        </div>
      </div>
    </Modal>
  );
};
