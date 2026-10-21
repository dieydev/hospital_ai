import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Collapse } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const { Paragraph, Text } = Typography;

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error captured by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 680,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              padding: '36px 32px',
              boxShadow: '0 10px 30px rgba(2, 132, 199, 0.12)',
              border: '1px solid #bae6fd',
              textAlign: 'center',
            }}
          >
            <Result
              status="warning"
              title={
                <span style={{ color: '#0f172a', fontWeight: 800, fontSize: 24 }}>
                  Đã xảy ra sự cố hiển thị ngoài dự kiến
                </span>
              }
              subTitle={
                <span style={{ color: '#475569', fontSize: 15 }}>
                  Hệ thống Bệnh viện Hospital AI đã tự động bẫy lỗi để bảo vệ an toàn phiên làm việc của bạn.
                  Vui lòng tải lại trang hoặc quay về trang chủ.
                </span>
              }
              extra={[
                <Button
                  type="primary"
                  key="reload"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                  style={{
                    backgroundColor: '#0284c7',
                    borderColor: '#0284c7',
                    height: 42,
                    padding: '0 24px',
                    fontWeight: 700,
                    borderRadius: 8,
                  }}
                >
                  Tải lại trang
                </Button>,
                <Button
                  key="home"
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                  style={{
                    borderColor: '#0284c7',
                    color: '#0284c7',
                    height: 42,
                    padding: '0 24px',
                    fontWeight: 700,
                    borderRadius: 8,
                  }}
                >
                  Về trang chủ
                </Button>,
              ]}
            />

            {/* Chi tiết lỗi kỹ thuật dành cho lập trình viên/kiểm thử */}
            {this.state.error && (
              <div style={{ marginTop: 24, textAlign: 'left' }}>
                <Collapse
                  ghost
                  items={[
                    {
                      key: '1',
                      label: (
                        <span style={{ fontSize: 13, color: '#64748b' }}>
                          <BugOutlined style={{ marginRight: 6 }} />
                          Xem chi tiết nhật ký lỗi (Debug Log)
                        </span>
                      ),
                      children: (
                        <div
                          style={{
                            background: '#f8fafc',
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: '#e11d48',
                            maxHeight: 180,
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          <Text strong style={{ color: '#b91c1c' }}>
                            {this.state.error.toString()}
                          </Text>
                          {this.state.errorInfo && (
                            <Paragraph style={{ marginTop: 8, color: '#475569', fontSize: 11 }}>
                              {this.state.errorInfo.componentStack}
                            </Paragraph>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
