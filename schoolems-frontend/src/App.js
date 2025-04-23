// src/App.js
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import EmployeeForm from "./components/EmployeeForm";
import Navbar from "./components/Navbar";
import React from 'react';
import DevRoleSwitcher from './components/DevRoleSwitcher';
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import { useAuth } from "./hooks/useAuth";
import RoleRoute from "./components/RoleRoute";
import Unauthorized from "./pages/Unauthorized";
import Spinner from "./components/Spinner";
import Register from "./pages/Register";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LeaveRequestsPage from "./pages/LeaveRequestsPage";
import LeaveRequestForm from "./components/LeaveRequestForm";
import PrivateRoute from "./components/PrivateRoute";
import DashboardLoader from "./components/DashboardLoader";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  return (
    <div className="App">
      {user && <Navbar />}

      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard (requires login) */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardLoader />
          </PrivateRoute>
        } />

        {/* Role-Based Protected Routes */}
        <Route path="/admin-dashboard" element={
          <RoleRoute requiredRole="admin">
            <AdminDashboard />
          </RoleRoute>
        } />
        <Route path="/manager-dashboard" element={
          <RoleRoute requiredRole="manager">
            <ManagerDashboard />
          </RoleRoute>
        } />
        <Route path="/employee-dashboard" element={
          <RoleRoute requiredRole="employee">
            <EmployeeDashboard />
          </RoleRoute>
        } />

        {/* Employee Routes */}
        <Route path="/employees" element={
          <RoleRoute requiredRole="employee">
            <Employees />
          </RoleRoute>
        } />
        <Route path="/employees/add" element={
          <RoleRoute requiredRole="employee">
            <Employees />
          </RoleRoute>
        } />
        <Route path="/employees/edit/:id" element={
          <RoleRoute requiredRole="employee">
            <EmployeeForm isEdit={true} />
          </RoleRoute>
        } />

        {/* Leave Routes */}
        <Route path="/leave-requests/new" element={
          <RoleRoute requiredRole="employee">
            <LeaveRequestForm />
          </RoleRoute>
        } />
        <Route path="/leave-requests" element={
          <RoleRoute requiredRole={['admin', 'manager', 'employee']}>
            <LeaveRequestsPage />
          </RoleRoute>
        } />

        {/* Other Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<div>404 Page Not Found</div>} />
      </Routes>

      {process.env.NODE_ENV === 'development' && <DevRoleSwitcher />}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}

export default App;
