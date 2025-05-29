import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Container,
  Stack,
  Divider,
} from '@mui/material';
import { Refresh, Home, BugReport } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Here you could also send error to an error reporting service
    // Example: Sentry.captureException(error);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Stack spacing={4} alignItems="center" textAlign="center">
            <BugReport sx={{ fontSize: 64, color: 'error.main' }} />

            <Alert severity="error" sx={{ width: '100%' }}>
              <AlertTitle>Something went wrong</AlertTitle>
              We're sorry, but something unexpected happened. The application has encountered an error.
            </Alert>

            <Box sx={{ width: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Application Error
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Don't worry, your data is safe. You can try refreshing the page or go back to the home page.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleReset}
                size="large"
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={this.handleReload}
                size="large"
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={this.handleGoHome}
                size="large"
              >
                Go Home
              </Button>
            </Stack>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <>
                <Divider sx={{ width: '100%' }} />
                <Box sx={{ width: '100%', textAlign: 'left' }}>
                  <Typography variant="h6" color="error" gutterBottom>
                    Error Details (Development Mode)
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>Error Message</AlertTitle>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {this.state.error.message}
                    </Typography>
                  </Alert>
                  {this.state.error.stack && (
                    <Alert severity="info">
                      <AlertTitle>Stack Trace</AlertTitle>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.75rem',
                          maxHeight: 300,
                          overflow: 'auto',
                        }}
                      >
                        {this.state.error.stack}
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
