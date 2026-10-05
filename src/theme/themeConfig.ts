import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

export const warmPalette = {
  primary: '#5C1D24', // Deep rich restaurant burgundy / wine
  primaryHover: '#73252E',
  primaryActive: '#43141A',
  gold: '#D97706',
  yellow: '#F59E0B',
  cream: '#FAF7F8', // Soft warm creamy tint matching reference
  creamCard: '#FFFFFF',
  charcoal: '#171214',
  darkCard: '#231B1E',
  darkBorder: '#3A2E33',
  success: '#15803D',
  warning: '#D97706',
  error: '#DC2626',
};

export const getAntdTheme = (isDarkMode: boolean): ThemeConfig => {
  return {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: warmPalette.primary,
      colorInfo: warmPalette.primary,
      colorSuccess: warmPalette.success,
      colorWarning: warmPalette.warning,
      colorError: warmPalette.error,
      colorBgBase: isDarkMode ? warmPalette.charcoal : warmPalette.cream,
      colorBgContainer: isDarkMode ? warmPalette.darkCard : '#FFFFFF',
      colorBgElevated: isDarkMode ? '#2C2226' : '#FFFFFF',
      colorBorder: isDarkMode ? warmPalette.darkBorder : '#F0E8ED',
      colorBorderSecondary: isDarkMode ? '#33292D' : '#F7F2F5',
      borderRadius: 16,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 14,
      controlHeight: 44,
    },
    components: {
      Button: {
        borderRadius: 14,
        fontWeight: 700,
        controlHeightLG: 52,
      },
      Card: {
        borderRadiusLG: 20,
      },
      Modal: {
        borderRadiusLG: 22,
      },
      Tag: {
        borderRadiusSM: 8,
        fontSize: 12,
      },
      Input: {
        borderRadius: 12,
      },
    },
  };
};
