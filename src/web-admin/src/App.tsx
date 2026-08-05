import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AppRoutes } from './routes/AppRoutes';
import { useThemeStore } from './store/useThemeStore';

export const App: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDarkMode ? '#38bdf8' : '#0284c7',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#f43f5e',
          colorInfo: '#38bdf8',
          borderRadius: 12,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgContainer: isDarkMode ? '#1e293b' : '#ffffff',
          colorBgLayout: isDarkMode ? '#0f172a' : '#f8fafc',
          colorTextBase: isDarkMode ? '#f8fafc' : '#0f172a',
          boxShadowSecondary: isDarkMode
            ? '0 10px 25px -3px rgba(0, 0, 0, 0.4)'
            : '0 10px 25px -3px rgba(15, 23, 42, 0.08)',
        },
        components: {
          Card: {
            paddingLG: 20,
          },
          Table: {
            headerBg: isDarkMode ? '#0f172a' : '#f8fafc',
            headerColor: isDarkMode ? '#cbd5e1' : '#475569',
            rowHoverBg: isDarkMode ? '#334155' : '#f0f9ff',
          },
          Menu: {
            darkItemBg: '#0f172a',
            darkItemSelectedBg: '#0284c7',
            darkItemHoverBg: '#1e293b',
          },
        },
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
