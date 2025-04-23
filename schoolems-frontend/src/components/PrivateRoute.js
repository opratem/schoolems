// src/components/PrivateRoute.js
import { Navigate } from "react-router-dom";
import { getToken } from '../utils/token';

const PrivateRoute = ({ children }) => {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
