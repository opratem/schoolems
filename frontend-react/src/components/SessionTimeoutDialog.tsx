import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { Warning, AccessTime, Refresh } from '@mui/icons-material';

interface SessionTimeoutDialogProps {
  open: boolean;
  timeRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
};

const getProgressValue = (timeRemaining: number, totalTime: number): number => {
  return ((totalTime - timeRemaining) / totalTime) * 100;
};

export default function SessionTimeoutDialog({
  open,
  timeRemaining,
  onExtendSession,
  onLogout,
}: SessionTimeoutDialogProps) {
  const totalWarningTime = 5 * 60 * 1000; // 5 minutes
  const progressValue = getProgressValue(timeRemaining, totalWarningTime);
  const formattedTime = formatTime(timeRemaining);
  const isUrgent = timeRemaining < 60000; // Less than 1 minute

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[10],
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Warning color={isUrgent ? "error" : "warning"} />
          <Typography variant="h6" component="div">
            Session Timeout Warning
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <Alert
            severity={isUrgent ? "error" : "warning"}
            sx={{ borderRadius: 1 }}
          >
            {isUrgent
              ? "Your session will expire very soon due to inactivity."
              : "Your session will expire soon due to inactivity."
            }
          </Alert>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Time remaining:
              </Typography>
              <Chip
                icon={<AccessTime />}
                label={formattedTime}
                color={isUrgent ? "error" : "warning"}
                variant="filled"
                size="small"
              />
            </Stack>

            <LinearProgress
              variant="determinate"
              value={progressValue}
              color={isUrgent ? "error" : "warning"}
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[200]
                    : theme.palette.grey[800],
              }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            You will be automatically logged out when the time expires.
            Click "Stay Logged In" to extend your session, or "Logout Now"
            to end your session immediately.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onLogout}
          variant="outlined"
          color="inherit"
          size="large"
        >
          Logout Now
        </Button>
        <Button
          onClick={onExtendSession}
          variant="contained"
          color={isUrgent ? "error" : "warning"}
          size="large"
          startIcon={<Refresh />}
          autoFocus
        >
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
