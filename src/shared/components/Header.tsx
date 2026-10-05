import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Button, 
  Tag, 
  Badge, 
  Tooltip, 
  Dropdown, 
  Space
} from 'antd';
import type { MenuProps } from 'antd';
import {
  ShopOutlined,
  FireOutlined,
  BarChartOutlined,
  SettingOutlined,
  WifiOutlined,
  DisconnectOutlined,
  SoundOutlined,
  AudioMutedOutlined,
  SunOutlined,
  MoonOutlined,
  SwapOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { formatKolkataTime } from '../../lib/formatters';
import { apiClient } from '../../lib/supabase';
import type { UserRole } from '../../types';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { currentRole, openPinModal } = useAuthStore();
  const { 
    isDarkMode, 
    toggleDarkMode, 
    isOnline, 
    setIsOnline, 
    pendingSyncCount, 
    setPendingSyncCount,
    soundMuted,
    toggleSoundMute,
    settings
  } = useSettingsStore();

  const [currentTime, setCurrentTime] = useState<string>(formatKolkataTime(new Date().toISOString()));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Keep Kolkata clock ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatKolkataTime(new Date().toISOString()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor network online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleManualSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const synced = await apiClient.syncPendingOrders();
      if (synced > 0) {
        setPendingSyncCount(Math.max(0, pendingSyncCount - synced));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    cashier: { label: 'Cashier', color: 'orange' },
    kitchen: { label: 'Kitchen Chef', color: 'volcano' },
    admin: { label: 'Admin / Owner', color: 'red' },
  };

  const roleMenuItems: MenuProps['items'] = [
    {
      key: 'cashier',
      icon: <ShopOutlined />,
      label: 'Switch to Cashier (PIN: 1111)',
      onClick: () => {
        openPinModal('cashier');
      },
    },
    {
      key: 'kitchen',
      icon: <FireOutlined />,
      label: 'Switch to Kitchen (PIN: 2222)',
      onClick: () => {
        openPinModal('kitchen');
      },
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Switch to Admin (PIN: 9999)',
      onClick: () => {
        openPinModal('admin');
      },
    },
  ];

  return (
    <header className="fc-header">
      <div className="fc-header-left">
        {/* Food Truck Brand Logo */}
        <div className="fc-brand" onClick={() => navigate('/order')}>
          <div className="fc-logo-badge">
            <span role="img" aria-label="fries">🍟</span>
          </div>
          <div className="fc-brand-text">
            <span className="fc-brand-title">{settings.truck_name || 'FRENCH CARTEL'}</span>
            <span className="fc-brand-subtitle">HOT FRIES IN BOWLS</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="fc-nav-tabs">
          <Button
            type={location.pathname === '/order' ? 'primary' : 'text'}
            icon={<ShopOutlined />}
            size="large"
            onClick={() => navigate('/order')}
            className="fc-nav-btn"
          >
            Order
          </Button>

          <Button
            type={location.pathname === '/kitchen' ? 'primary' : 'text'}
            icon={<FireOutlined />}
            size="large"
            onClick={() => navigate('/kitchen')}
            className="fc-nav-btn"
          >
            Kitchen
          </Button>

          <Button
            type={location.pathname === '/dashboard' ? 'primary' : 'text'}
            icon={<BarChartOutlined />}
            size="large"
            onClick={() => {
              if (currentRole !== 'admin') {
                openPinModal('admin');
              } else {
                navigate('/dashboard');
              }
            }}
            className="fc-nav-btn"
          >
            Dashboard
          </Button>

          <Button
            type={location.pathname === '/admin' ? 'primary' : 'text'}
            icon={<SettingOutlined />}
            size="large"
            onClick={() => {
              if (currentRole !== 'admin') {
                openPinModal('admin');
              } else {
                navigate('/admin');
              }
            }}
            className="fc-nav-btn"
          >
            Admin
          </Button>
        </nav>
      </div>

      <div className="fc-header-right">
        {/* Kolkata Local Time */}
        <div className="fc-clock">
          <ClockCircleOutlined style={{ marginRight: 6, color: '#FA8C16' }} />
          <span>{currentTime}</span>
        </div>

        {/* Online / Offline Sync Indicator */}
        <div className="fc-status-indicator">
          {isOnline ? (
            <Tooltip title={pendingSyncCount > 0 ? `${pendingSyncCount} orders waiting to sync` : 'Connected & Live'}>
              <Tag 
                color="success" 
                icon={<WifiOutlined />} 
                style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 13 }}
                onClick={handleManualSync}
              >
                ONLINE {pendingSyncCount > 0 && <Badge count={pendingSyncCount} offset={[6, -2]} />}
              </Tag>
            </Tooltip>
          ) : (
            <Tooltip title="Offline mode: Orders saved locally in IndexedDB and will sync automatically when connected">
              <Tag color="error" icon={<DisconnectOutlined />} style={{ padding: '4px 10px', fontSize: 13 }}>
                OFFLINE ({pendingSyncCount} pending)
              </Tag>
            </Tooltip>
          )}

          {pendingSyncCount > 0 && isOnline && (
            <Button
              size="small"
              icon={<SyncOutlined spin={isSyncing} />}
              onClick={handleManualSync}
              type="primary"
            >
              Sync
            </Button>
          )}
        </div>

        {/* Audio Mute/Unmute */}
        <Tooltip title={soundMuted ? 'Sound Muted' : 'Sound Alerts Enabled'}>
          <Button
            shape="circle"
            size="large"
            icon={soundMuted ? <AudioMutedOutlined style={{ color: '#FF4D4F' }} /> : <SoundOutlined style={{ color: '#52C41A' }} />}
            onClick={toggleSoundMute}
          />
        </Tooltip>

        {/* Dark/Light mode toggle */}
        <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Truck Night Dark Mode'}>
          <Button
            shape="circle"
            size="large"
            icon={isDarkMode ? <SunOutlined style={{ color: '#FFD13B' }} /> : <MoonOutlined />}
            onClick={toggleDarkMode}
          />
        </Tooltip>

        {/* Role Pill & Quick Switcher */}
        <Dropdown menu={{ items: roleMenuItems }} trigger={['click']} placement="bottomRight">
          <Button 
            size="large" 
            className="fc-role-btn"
            icon={<UserOutlined />}
          >
            <Space>
              <Tag color={roleLabels[currentRole].color} style={{ margin: 0, fontWeight: 700 }}>
                {roleLabels[currentRole].label}
              </Tag>
              <SwapOutlined style={{ color: '#8C8C8C', fontSize: 12 }} />
            </Space>
          </Button>
        </Dropdown>
      </div>
    </header>
  );
};
