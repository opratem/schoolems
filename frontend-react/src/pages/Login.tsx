import type React from "react";
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Link,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setUser, user } = useAuth();

  useEffect(() => {
    // Show session expired warning if present
    if (localStorage.getItem("sessionExpired")) {
      setSessionExpired(true);
      localStorage.removeItem("sessionExpired");
    }

    // If user is already logged in, redirect to dashboard
    if (user) {
      console.log("User already logged in, redirecting to dashboard");
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login with username:", username);

      const response = await api.post("/auth/login", {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });

      console.log("Login successful, response:", response.data);

      // Extract data from response
      const { token, username: respUser, role, employeeId, employeeDbId } = response.data;

      // Use the correct employee ID (employeeDbId is the PK id from database)
      const actualEmployeeId = employeeDbId || employeeId;
      console.log("Setting employee ID to:", actualEmployeeId);

      // Calculate token expiration (30 minutes from now)
      const expiresAt = Date.now() + (30 * 60 * 1000);

      // Set user in context
      setUser({
        username: respUser,
        role,
        token,
        employeeId: actualEmployeeId,
        expiresAt,
      });

      // Store in localStorage
      localStorage.setItem("employeeId", actualEmployeeId?.toString() || "");
      localStorage.setItem("token", token);
      localStorage.setItem("username", respUser);
      localStorage.setItem("role", role);
      localStorage.setItem("tokenExpiry", expiresAt.toString());

      // Navigate to dashboard
      console.log("Login complete, redirecting to dashboard");
      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
      let errorMessage = "Invalid username or password";

      if (err.response) {
        console.log("Error response status:", err.response.status);
        console.log("Error response data:", err.response.data);

        if (err.response.status === 401) {
          errorMessage = "Invalid username or password";
        } else if (err.response.status === 403) {
          errorMessage = "Your account does not have permission to access this application";
        } else if (err.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = "No response from server. Please check your internet connection.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Login
          </Typography>
          {sessionExpired && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Session expired. Please log in again.
            </Alert>
          )}
          <Box component="form" sx={{ mt: 2 }} onSubmit={handleSubmit}>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Login"}
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Register
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
