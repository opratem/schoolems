import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import EmployeeForm from "./components/EmployeeForm";
import Navbar from "./components/Navbar";
import React from 'react';
import DevRoleSwitcher from './components/DevRoleSwitcher';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './hooks/useAuth';
import RoleRoute from './components/RoleRoute';
import Unauthorized from "./pages/Unauthorized";
import Spinner from './components/Spinner';
import Register from './pages/Register';

function App() {
    const { role, loading } = useAuth();

    if(loading) return <Spinner />;

    return (
        <div className="App">
        <BrowserRouter>
            <Navbar />
            <Routes>
                {/* Default path redirects to Login */}
                <Route path="/" element={<Login />} />
                <Route path='/login' element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/*Protected route for employees (requires JWT token) */}
                <Route
                    path = "/employees"
                    element={
                        <RoleRoute requiredRole ="employee">
                            <Employees/>
                        </RoleRoute>
                    }
                />

                <Route
                 path="/employees/add"
                 element={
                    <RoleRoute requiredRole ="employee">
                         <Employees/>
                    </RoleRoute>
                }
                />

                <Route
                    path="/employees/edit/:id"
                    element={
                        <RoleRoute requiredRole="employee">
                            <EmployeeForm isEdit={true} />
                        </RoleRoute>
                    }
                />

                <Route
                    path= "/admin-dashboard"
                    element= {
                        <RoleRoute requiredRole="admin">
                            <div className= "route-container">
                                <AdminDashboard />
                            </div>
                        </RoleRoute>
                    }
                />
                <Route path = "/unauthorized" element ={<Unauthorized />} />
            </Routes>
        </BrowserRouter>

        {process.env.NODE_ENV === 'development' && <DevRoleSwitcher/>}
    </div>
    );
}

export default App;