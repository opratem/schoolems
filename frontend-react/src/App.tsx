import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, createTheme, responsiveFontSizes } from "@mui/material";
import { SnackbarProvider } from 'notistack';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import LeaveRequests from "./pages/LeaveRequests";
import LeaveRequestSubmit from "./pages/LeaveRequestSubmit";
import CalendarView from "./pages/CalendarView";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavigationBar from "./components/NavigationBar";
import SessionManager from "./components/SessionManager";

// Create a professional theme
let theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Professional blue
      light: '#4791db',
      dark: '#115293',
    },
    secondary: {
      main: '#f50057', // Accent color for important actions
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5', // Light gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none', // More modern look without all-caps
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: 'none',
          padding: '8px 16px',
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f7fa',
        },
      },
    },
  },
});

// Make the theme responsive
theme = responsiveFontSizes(theme);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={3000}
      >
        <AuthProvider>
          <SessionManager>
            <Router>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                <Route path="/leaverequests" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                {/* The LeaveRequestSubmit component now handles the redirect to /leaverequests?action=submit */}
                <Route path="/leaverequests/submit" element={<ProtectedRoute><LeaveRequestSubmit /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </SessionManager>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
