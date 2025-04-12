import { Navigate, useLocation } from "react-router-dom";
import { getToken } from '../utils/token';

const ProtectedRoute({ children }) => {
    const location = useLocation();
    const token = getToken();

    if(!token) {
        return <Navigate to= "/" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;