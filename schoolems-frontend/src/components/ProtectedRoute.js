import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUserRole } from "../services/auth";

function ProtectedRoute({ children, requiredRole }) {
    const location = useLocation();
    const token = localStorage.getItem("token");
    const userRole = getCurrentUserRole();

    if(!token) {
        return <Navigate to= "/" state={{ from: location }} replace />;
    }

    if (requiredRole && userRole !== requiredRole){
        return <Navigate to="/employees" replace />;
    }

    return children;
}

export default ProtectedRoute;