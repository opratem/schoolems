import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/token';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

/**
 * RoleRoute guards routes based on the user's role.
 * @param {JSX.Element} children - Component to render if access is granted.
 * @param {string|string[]} requiredRole - Role or roles allowed to access this route.
 */
const RoleRoute = ({ children, requiredRole }) => {
    const token = getToken();
    const { role, loading } = useAuth();

    if (!token) return <Navigate to="/login" replace />;
    if (loading) return <Spinner />;

    const allowedRoles = Array.isArray(requiredRole)
        ? requiredRole.map(r => r.toUpperCase())
        : [requiredRole.toUpperCase()];

    if (!allowedRoles.includes(role)){
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default RoleRoute;
