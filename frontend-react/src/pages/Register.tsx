import type React from "react";
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Box,
  Link,
  Alert,
} from "@mui/material";
import axios from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";

const ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"];

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<string>(""); // Changed from roles array to single role
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [errors, setErrors] = useState<any>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleRoleChange = (event: any) => {
    setRole(event.target.value);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!username) newErrors.username = "Username is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrors.email = "Invalid email";
    if (!password) newErrors.password = "Password required";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!role) newErrors.role = "Role is required";

    // All users need basic information, not just employees
    if (!employeeId) newErrors.employeeId = "Employee/Staff ID is required";
    if (!name) newErrors.name = "Full name is required";
    if (!department) newErrors.department = "Department is required";
    if (!position) newErrors.position = "Position is required";
    if (!contactInfo) newErrors.contactInfo = "Contact information is required";
    if (!startDate) newErrors.startDate = "Start date is required";

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await axios.post("/auth/register", {
        username,
        password,
        email,
        roles: [role], // Send as array for backend compatibility
        employeeId,
        name,
        department,
        position,
        contactInfo,
        startDate,
      });
      setSuccess("Registration successful! You can now login.");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("");
      setEmployeeId("");
      setName("");
      setDepartment("");
      setPosition("");
      setContactInfo("");
      setStartDate(new Date().toISOString().slice(0, 10));
    } catch (err: any) {
      setApiError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <Container maxWidth="xs">
      <Typography variant="h4" align="center" sx={{ mt: 8, mb: 2 }}>
        Register Page
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.username}
          helperText={errors.username}
        />
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.password}
          helperText={errors.password}
        />
        <TextField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
        />
        <FormControl fullWidth margin="normal" required error={!!errors.role}>
          <InputLabel>Role</InputLabel>
          <Select
            value={role}
            onChange={handleRoleChange}
            label="Role"
          >
            {ROLES.map((roleOption) => (
              <MenuItem key={roleOption} value={roleOption}>
                {roleOption}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{errors.role}</FormHelperText>
        </FormControl>

        {/* Show employee details for all roles */}
        <TextField
          label={role === "EMPLOYEE" ? "Employee ID" : "Staff ID"}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.employeeId}
          helperText={errors.employeeId}
        />
        <TextField
          label="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          label="Department"
          value={department}
          onChange={e => setDepartment(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.department}
          helperText={errors.department}
        />
        <TextField
          label="Position"
          value={position}
          onChange={e => setPosition(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.position}
          helperText={errors.position}
        />
        <TextField
          label="Contact Info"
          value={contactInfo}
          onChange={e => setContactInfo(e.target.value)}
          margin="normal"
          fullWidth
          required
          error={!!errors.contactInfo}
          helperText={errors.contactInfo}
        />
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          margin="normal"
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
          error={!!errors.startDate}
          helperText={errors.startDate}
        />

        <Button
          variant="contained"
          color="primary"
          type="submit"
          fullWidth
          sx={{ mt: 2 }}
        >
          Register
        </Button>
        <Button
          component={RouterLink}
          to="/login"
          variant="text"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Back to Login
        </Button>
        {apiError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {apiError}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
            <Box sx={{ mt: 1 }}>
              <Link component={RouterLink} to="/login">
                Click here to login
              </Link>
            </Box>
          </Alert>
        )}
      </Box>
    </Container>
  );
}
