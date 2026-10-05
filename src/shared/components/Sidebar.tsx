import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShopOutlined, 
  FireOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  AppstoreOutlined,
  TableOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
  EditOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { Avatar, Tooltip } from 'antd';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, openPinModal } = useAuthStore();
  const { settings } = useSettingsStore();

  const navLinks = [
    {
      path: '/order',
      title: 'POS / Order Queue',
      icon: <EditOutlined />,
      label: 'Order POS',
      badge: 'Active',
    },
    {
      path: '/kitchen',
      title: 'Kitchen Sticky Board',
      icon: <FireOutlined />,
      label: 'Kitchen Wall',
      badge: 'Cook',
    },
    {
      path: '/dashboard',
      title: 'Executive Analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      roleRequired: 'admin',
    },
    {
      path: '/admin',
      title: 'Menu Catalog & Admin',
      icon: <AppstoreOutlined />,
      label: 'Menu Catalog',
      roleRequired: 'admin',
    },
  ];

  const handleNav = (path: string, roleRequired?: string) => {
    if (roleRequired === 'admin' && currentRole !== 'admin') {
      openPinModal('admin');
      return;
    }
    navigate(path);
  };

  return (
    <aside className="fc-ref-sidebar">
      {/* Brand Icon (Burgundy Leaf / Fry Badge from reference top-left) */}
      <div className="fc-ref-brand" onClick={() => navigate('/order')}>
        <div className="fc-ref-logo-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 16.5V7.5L16 12L11 16.5Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      </div>

      {/* Nav Icon Dock (Matching the top dock from reference, organized on the left side) */}
      <nav className="fc-ref-nav-dock">
        {navLinks.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Tooltip key={item.path} title={item.title} placement="right">
              <button
                type="button"
                className={`fc-ref-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.path, item.roleRequired)}
              >
                <span className="fc-ref-icon-wrapper">{item.icon}</span>
                <span className="fc-ref-nav-text">{item.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom Profile / Role Switch */}
      <div className="fc-ref-sidebar-footer">
        <Tooltip title={`Current Role: ${currentRole.toUpperCase()} (Tap to switch)`} placement="right">
          <div className="fc-ref-user-btn" onClick={() => openPinModal('admin')}>
            <Avatar size={40} style={{ backgroundColor: '#5C1D24', fontWeight: 800 }}>
              {currentRole.charAt(0).toUpperCase()}
            </Avatar>
            <div className="fc-ref-user-status" />
          </div>
        </Tooltip>
      </div>
    </aside>
  );
};
