import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Divider,
  Avatar,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Work,
  Business,
  CalendarToday,
  Lock,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Badge,
  Security,
  AccountCircle,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../api/axios';
import dayjs from 'dayjs';

interface Employee {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  contactInfo: string;
  startDate: string;
}

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  employee?: Employee;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function getNetworkErrorMessage(error: any, fallback: string) {
  if (error?.response) {
    // Server responded with a status code out of 2xx
    if (error.response.status === 401) {
      return 'Session expired. Please login again.';
    }
    if (error.response.data?.message) {
      return error.response.data.message;
    }
    return `Server error (${error.response.status})`;
  } else if (error?.request) {
    // Request was made but no response
    return 'Network error: Unable to reach the server. Please check your internet connection.';
  } else if (error?.message) {
    // Something else happened
    return `Error: ${error.message}`;
  }
  return fallback;
}

export default function UserProfile() {
  const { user } = useContext(AuthContext) || {};
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    contactInfo: '',
  });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [snack, setSnack] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);

  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Fetch user profile data
  const fetchProfile = async () => {
    try {
      // Fetch user profile data including email
      const userRes = await api.get('/users/profile');

      // Fetch employee data if employeeId exists
      let employeeData = null;
      if (user?.employeeId) {
        try {
          const employeeRes = await api.get(`/employees/${user.employeeId}`);
          employeeData = employeeRes.data;
        } catch (employeeError) {
          console.warn('Employee data not found, but user profile exists:', employeeError);
          // Continue without employee data - some users may not have employee records
        }
      }

      const userProfile: UserProfile = {
        id: userRes.data.id,
        username: userRes.data.username,
        email: userRes.data.email || '',
        employee: employeeData,
      };

      setProfile(userProfile);
      setEditForm({
        email: userProfile.email || '',
        contactInfo: userProfile.employee?.contactInfo || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      const message = getNetworkErrorMessage(error, 'Failed to load profile data');
      setSnack({ msg: message, type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, [user]);

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing - reset form
      setEditForm({
        email: profile?.email || '',
        contactInfo: profile?.employee?.contactInfo || '',
      });
    }
    setEditing(!editing);
  };

  const handleSaveProfile = async () => {
    setSubmitting(true);
    try {
      // Update user email if changed
      if (editForm.email !== profile?.email) {
        await api.put('/users/profile', { email: editForm.email });
      }

      // Update employee contact info only if employee exists
      if (profile?.employee && editForm.contactInfo !== profile.employee.contactInfo) {
        const updatedEmployee = {
          ...profile.employee,
          contactInfo: editForm.contactInfo,
        };

        await api.put(`/employees/${profile.employee.id}`, updatedEmployee);
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        email: editForm.email,
        employee: prev.employee ? { ...prev.employee, contactInfo: editForm.contactInfo } : null
      } : null);

      setEditing(false);
      setSnack({ msg: 'Profile updated successfully', type: 'success' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const message = getNetworkErrorMessage(error, 'Failed to update profile');
      setSnack({ msg: message, type: 'error' });
    }
    setSubmitting(false);
  };

  const validatePasswordForm = () => {
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setPasswordChanging(true);
    try {
      // This endpoint would need to be implemented in the backend
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setSnack({ msg: 'Password changed successfully', type: 'success' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      const message = getNetworkErrorMessage(error, 'Failed to change password');
      setSnack({ msg: message, type: 'error' });
    }
    setPasswordChanging(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'MANAGER': return 'warning';
      case 'EMPLOYEE': return 'primary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography>Loading profile...</Typography>
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" color="error">
            Profile not found
          </Typography>
          <Typography color="text.secondary">
            Unable to load your profile information.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your account information
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {profile.employee?.name || profile.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip
                label={user?.role}
                color={getRoleColor(user?.role || '')}
                size="small"
                icon={<Security />}
              />
              {profile.employee && (
                <Chip
                  label={`ID: ${profile.employee.employeeId}`}
                  variant="outlined"
                  size="small"
                  icon={<Badge />}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Member since {profile.employee ? dayjs(profile.employee.startDate).format('MMMM YYYY') : 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Button
              variant={editing ? "outlined" : "contained"}
              startIcon={editing ? <Cancel /> : <Edit />}
              onClick={handleEditToggle}
              disabled={submitting}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
            {editing && (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveProfile}
                disabled={submitting}
                sx={{ ml: 1 }}
              >
                {submitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                Save Changes
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountCircle color="primary" />
                Personal Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profile.employee?.name || ''}
                  disabled
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Username"
                  value={profile.username}
                  disabled
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={editing ? editForm.email : profile.email || 'Not provided'}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!editing}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Contact Information"
                  value={editing ? editForm.contactInfo : profile.employee?.contactInfo || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                  disabled={!editing}
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Work Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work color="primary" />
                Work Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                {profile.employee ? (
                  <>
                    <TextField
                      fullWidth
                      label="Department"
                      value={profile.employee.department || 'N/A'}
                      disabled
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Position"
                      value={profile.employee.position || 'N/A'}
                      disabled
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: <Work sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Employee ID"
                      value={profile.employee.employeeId || 'N/A'}
                      disabled
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Start Date"
                      value={profile.employee ? dayjs(profile.employee.startDate).format('MMMM D, YYYY') : 'N/A'}
                      disabled
                      InputProps={{
                        startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Employee information not available for this user role.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock color="primary" />
                Security Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Lock />
                  </ListItemIcon>
                  <ListItemText
                    primary="Password"
                    secondary="Change your account password"
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setPasswordDialog(true);
                      setPasswordErrors({});
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    disabled={submitting || passwordChanging}
                  >
                    Change Password
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={passwordDialog} onClose={() => { if (!passwordChanging) setPasswordDialog(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} error={!!passwordErrors.currentPassword}>
              <InputLabel>Current Password</InputLabel>
              <OutlinedInput
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Current Password"
                disabled={passwordChanging}
              />
              {passwordErrors.currentPassword && (
                <Typography variant="caption" color="error">{passwordErrors.currentPassword}</Typography>
              )}
            </FormControl>

            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} error={!!passwordErrors.newPassword}>
              <InputLabel>New Password</InputLabel>
              <OutlinedInput
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="New Password"
                disabled={passwordChanging}
              />
              {passwordErrors.newPassword && (
                <Typography variant="caption" color="error">{passwordErrors.newPassword}</Typography>
              )}
            </FormControl>

            <FormControl fullWidth variant="outlined" error={!!passwordErrors.confirmPassword}>
              <InputLabel>Confirm New Password</InputLabel>
              <OutlinedInput
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Confirm New Password"
                disabled={passwordChanging}
              />
              {passwordErrors.confirmPassword && (
                <Typography variant="caption" color="error">{passwordErrors.confirmPassword}</Typography>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)} disabled={passwordChanging}>
            Cancel
          </Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={passwordChanging}
            startIcon={passwordChanging ? <CircularProgress size={20} /> : null}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={6000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack && (
          <Alert onClose={() => setSnack(null)} severity={snack.type}>
            {snack.msg}
          </Alert>
        )}
      </Snackbar>
    </Container>
  );
}
