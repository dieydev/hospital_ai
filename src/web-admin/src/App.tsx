import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0284c7', // Sky / Medical Electric Blue
          colorSuccess: '#10b981', // Emerald Green
          colorWarning: '#f59e0b', // Warm Amber
          colorError: '#f43f5e',   // Vibrant Rose
          colorInfo: '#38bdf8',
          borderRadius: 12,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f8fafc',
          boxShadowSecondary: '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -4px rgba(15, 23, 42, 0.03)',
        },
        components: {
          Card: {
            paddingLG: 20,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f0f9ff',
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
