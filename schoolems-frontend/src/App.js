import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login";
import Employees from "./pages/Employees";
import EmployeeForm from "./components/EmployeeForm";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import AdminRoute from './components/AdminRoute';
import { React } from 'react';
import DevRoleSwitcher from './components/DevRoleSwitcher';
import AdminDashboard from './pages/AdminDashboard';

function App() {
    return (
        <div className="App">
        <BrowserRouter>
            <Navbar />
            <Routes>
                {/* Default path redirects to Login */}
                <Route path="/" element={<Login />} />

                {/*Protected route for employees (requires JWT token) */}
                <Route
                    path = "/employees"
                    element={
                        <ProtectedRoute>
                            <Employees/>
                        </ProtectedRoute>
                    }
                />

                <Route
                 path="/employees/add"
                 element={
                    <ProtectedRoute>
                        <EmployeeForm/>
                    </ProtectedRoute>
                }
                />

                <Route
                    path="/employees/edit/:id"
                    element={
                        <ProtectedRoute>
                            <EmployeeForm isEdit={true} />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path= "/admin-dashboard"
                    element= {
                        <AdminRoute>
                            <div className= "route-container">
                                <AdminDashboard />
                            </div>
                        </AdminRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
        {process.env.NODE_ENV === 'development' && <DevRoleSwitcher/>}
    </div>
    );
}

export default App;