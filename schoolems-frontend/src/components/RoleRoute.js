import { Navigate } from "react-router-dom";
import { getToken } from '../utils/token';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

const RoleRoute = ({ children, requiredRole }) => {
    const token = getToken();
    const { role, loading } = useAuth();

    if(!token) return <Navigate to="/" replace />;
    if (!role) return <Spinner />;

    if (requiredRole && role.toLowerCase() !== requiredRole.toLowerCase()) {
        return <Navigate to= "/unauthorized" replace />;
    }

    return children;
};

export default RoleRoute;