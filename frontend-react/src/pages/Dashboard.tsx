import React, { useEffect, useState } from "react";
import {
  Container, Typography, Grid, Card, CardContent, Button, Box,
  AppBar, Toolbar, IconButton, Menu, MenuItem, Paper, Divider,
  CardHeader, Chip, CircularProgress
} from "@mui/material";
import {
  AccountCircle, ExitToApp, Dashboard as DashboardIcon,
  People, EventNote, TrendingUp, CalendarToday
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from "../api/axios";
import NavigationBar from "../components/NavigationBar";

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { user, logout, isAdmin, isManager, isEmployee } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [adminManagerMetrics, setAdminManagerMetrics] = useState({
    totalEmployees: 0,
    totalLeaveRequests: 0,
    pendingLeaveRequests: 0,
    approvedLeaveRequests: 0,
    rejectedLeaveRequests: 0
  });

  const [employeeMetrics, setEmployeeMetrics] = useState({
    totalSubmitted: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    navigate("/login");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isAdmin || isManager) {
          // Employees
          const empRes = await api.get("/employees");
          const totalEmployees = Array.isArray(empRes.data) ? empRes.data.length : 0;

          // Leave requests
          const leaveRes = await api.get("/leaverequests");
          const leaveRequests = Array.isArray(leaveRes.data) ? leaveRes.data : [];
          const totalLeaveRequests = leaveRequests.length;
          const pendingLeaveRequests = leaveRequests.filter((lr: any) => lr.status === "PENDING").length;
          const approvedLeaveRequests = leaveRequests.filter((lr: any) => lr.status === "APPROVED").length;
          const rejectedLeaveRequests = leaveRequests.filter((lr: any) => lr.status === "REJECTED").length;

          setAdminManagerMetrics({
            totalEmployees,
            totalLeaveRequests,
            pendingLeaveRequests,
            approvedLeaveRequests,
            rejectedLeaveRequests
          });

          // Set recent activity
          setRecentActivity(leaveRequests.slice(0, 5));

        } else if (isEmployee && user?.employeeId) {
          // Use employeeId property
          const employeeId = user.employeeId;
          const res = await api.get(`/leaverequests/employee/${employeeId}`);
          const leaveRequests = Array.isArray(res.data) ? res.data : [];

          setEmployeeMetrics({
            totalSubmitted: leaveRequests.length,
            pending: leaveRequests.filter((lr: any) => lr.status === "PENDING").length,
            approved: leaveRequests.filter((lr: any) => lr.status === "APPROVED").length,
            rejected: leaveRequests.filter((lr: any) => lr.status === "REJECTED").length,
          });

          // Set recent activity for employee
          setRecentActivity(leaveRequests.slice(0, 5));
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to fetch metrics");
        enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role) fetchData();
  }, [user, isAdmin, isManager, isEmployee, enqueueSnackbar]);

  // Generate chart data for admin/manager
  const getAdminLeaveStatusData = () => [
    { name: 'Pending', value: adminManagerMetrics.pendingLeaveRequests },
    { name: 'Approved', value: adminManagerMetrics.approvedLeaveRequests },
    { name: 'Rejected', value: adminManagerMetrics.rejectedLeaveRequests },
  ];

  // Generate chart data for employee
  const getEmployeeLeaveStatusData = () => [
    { name: 'Pending', value: employeeMetrics.pending },
    { name: 'Approved', value: employeeMetrics.approved },
    { name: 'Rejected', value: employeeMetrics.rejected },
  ];

  // Department distribution data (mock data - replace with actual data when available)
  const departmentData = [
    { name: 'IT', count: 10 },
    { name: 'HR', count: 5 },
    { name: 'Finance', count: 7 },
    { name: 'Operations', count: 8 },
  ];

  if (loading)
    return (
      <Container maxWidth="lg">
        <NavigationBar />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading dashboard metrics...
          </Typography>
        </Box>
      </Container>
    );

  if (error)
    return (
      <Container maxWidth="lg">
        <NavigationBar />
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      <NavigationBar />
      <Box sx={{ mt: 4, mb: 3, display: 'flex', alignItems: 'center' }}>
        <DashboardIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
      </Box>

      {/* Admin/Manager Dashboard */}
      {(isAdmin || isManager) && (
        <>
          {/* Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Employees
                  </Typography>
                  <Typography variant="h4">{adminManagerMetrics.totalEmployees}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    <TrendingUp fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, color: 'success.main' }} />
                    Active staff members
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Leave Requests
                  </Typography>
                  <Typography variant="h4">{adminManagerMetrics.totalLeaveRequests}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    All time requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Requests
                  </Typography>
                  <Typography variant="h4">{adminManagerMetrics.pendingLeaveRequests}</Typography>
                  <Chip
                    label="Requires attention"
                    size="small"
                    color="warning"
                    sx={{ mt: 1 }}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Approved Requests
                  </Typography>
                  <Typography variant="h4">{adminManagerMetrics.approvedLeaveRequests}</Typography>
                  <Chip
                    label="Processed"
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', height: '100%' }}>
                <CardHeader title="Leave Request Status" />
                <Divider />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getAdminLeaveStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {getAdminLeaveStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', height: '100%' }}>
                <CardHeader title="Employees by Department" />
                <Divider />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={departmentData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Employees" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', mb: 4 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              {isAdmin && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/employees/add")}
                  startIcon={<People />}
                >
                  Add Employee
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/employees")}
                startIcon={<People />}
              >
                View All Employees
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/leaverequests")}
                startIcon={<EventNote />}
              >
                View Leave Requests
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/leaverequests")}
                startIcon={<EventNote />}
              >
                Approve/Reject Leaves
              </Button>
            </Box>
          </Paper>
        </>
      )}

      {/* Employee Dashboard */}
      {isEmployee && (
        <>
          {/* Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Submitted
                  </Typography>
                  <Typography variant="h4">{employeeMetrics.totalSubmitted}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Leave requests submitted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4">{employeeMetrics.pending}</Typography>
                  <Chip
                    label="Awaiting response"
                    size="small"
                    color="warning"
                    sx={{ mt: 1 }}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Approved
                  </Typography>
                  <Typography variant="h4">{employeeMetrics.approved}</Typography>
                  <Chip
                    label="Accepted"
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Rejected
                  </Typography>
                  <Typography variant="h4">{employeeMetrics.rejected}</Typography>
                  <Chip
                    label="Declined"
                    size="small"
                    color="error"
                    sx={{ mt: 1 }}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Chart */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0', height: '100%' }}>
                <CardHeader title="Your Leave Request Status" />
                <Divider />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getEmployeeLeaveStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {getEmployeeLeaveStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', mb: 4 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/leaverequests?action=submit")}
                startIcon={<EventNote />}
              >
                Submit Leave Request
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/leaverequests")}
                startIcon={<EventNote />}
              >
                View My Leave Requests
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
}
