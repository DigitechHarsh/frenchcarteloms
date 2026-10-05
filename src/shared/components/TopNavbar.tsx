import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Tag, 
  Tooltip, 
  Avatar, 
  Badge, 
  Dropdown 
} from 'antd';
import type { MenuProps } from 'antd';
import { 
  SearchOutlined, 
  BellOutlined, 
  FullscreenOutlined, 
  SunOutlined, 
  MoonOutlined, 
  SoundOutlined, 
  AudioMutedOutlined,
  WifiOutlined,
  DisconnectOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { formatKolkataTime } from '../../lib/formatters';
import { apiClient } from '../../lib/supabase';

export const TopNavbar: React.FC = () => {
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatKolkataTime(new Date().toISOString()));
    }, 1000);
    return () => clearInterval(timer);
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

  const roleMenuItems: MenuProps['items'] = [
    {
      key: 'cashier',
      label: 'Switch to Cashier (PIN: 1111)',
      onClick: () => openPinModal('cashier'),
    },
    {
      key: 'kitchen',
      label: 'Switch to Kitchen (PIN: 2222)',
      onClick: () => openPinModal('kitchen'),
    },
    {
      key: 'admin',
      label: 'Switch to Admin / Owner (PIN: 9999)',
      onClick: () => openPinModal('admin'),
    },
  ];

  return (
    <header className="fc-ref-topbar">
      <div className="fc-ref-topbar-left">
        <h1 className="fc-ref-app-title">French Cartel</h1>
      </div>

      <div className="fc-ref-topbar-right">
        {/* Live Kolkata Clock */}
        <div className="fc-ref-clock">
          <span>{currentTime}</span>
        </div>

        {/* Online / Offline Sync Indicator */}
        <div className="fc-nav-status-pill" onClick={handleManualSync}>
          <span className={`fc-status-circle ${isOnline ? 'online' : 'offline'}`} />
          <span className="fc-status-label">{isOnline ? 'LIVE' : 'OFFLINE'}</span>
          {pendingSyncCount > 0 && <Badge count={pendingSyncCount} size="small" />}
        </div>

        {/* Dark/Light mode toggle */}
        <Tooltip title={isDarkMode ? 'Light Mode' : 'Night Mode'}>
          <Button
            shape="circle"
            size="small"
            className="fc-ref-icon-circle-btn"
            icon={isDarkMode ? <SunOutlined style={{ color: '#F59E0B' }} /> : <MoonOutlined />}
            onClick={toggleDarkMode}
          />
        </Tooltip>

        {/* Role Avatar Capsule */}
        <Dropdown menu={{ items: roleMenuItems }} trigger={['click']} placement="bottomRight">
          <div className="fc-ref-profile-capsule">
            <Avatar 
              size={28} 
              style={{ backgroundColor: '#5C1D24', fontWeight: 800, fontSize: 11 }}
            >
              {currentRole[0].toUpperCase()}
            </Avatar>
            <div className="fc-ref-profile-info">
              <span className="fc-ref-role-label">{currentRole.toUpperCase()}</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
};
