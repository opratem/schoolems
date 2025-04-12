import {  Navigate  }  from  "react-router-dom";
import  {  getToken  }  from  '../utils/token';
import  {  useAuth  }  from  '..hooks/useAuth';

const AdminRoute = ({  children  }) => {
  const token  =  getToken();
  const role  =  useAuth();

  if (!token) return <Navigate to="/" replace />;
  if (!role) return null;
  if (role !== 'admin' && role !== 'ADMIN') return <Navigate to ="/employees" replace />;

  return children;
};

export  default  AdminRoute;