import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: 24 }}>
          <Result
            status="error"
            title="French Cartel OMS - Safe Recovery"
            subTitle={this.state.errorMessage}
            extra={[
              <Button
                type="primary"
                key="reload"
                onClick={this.handleReset}
                style={{ backgroundColor: '#5C1D24', borderColor: '#5C1D24', fontWeight: 700 }}
              >
                Reload Application
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
