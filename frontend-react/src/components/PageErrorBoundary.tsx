import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Stack,
} from '@mui/material';
import { Refresh, ArrowBack } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  pageName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class PageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.pageName || 'page'}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoBack = () => {
    window.history.back();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Stack spacing={3} alignItems="center">
              <Alert severity="error" sx={{ width: '100%' }}>
                <Typography variant="h6">
                  Error loading {this.props.pageName || 'this page'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Something went wrong while rendering this page. Please try again.
                </Typography>
              </Alert>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={this.handleGoBack}
                >
                  Go Back
                </Button>
              </Stack>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert severity="warning" sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error.message}
                  </Typography>
                </Alert>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
