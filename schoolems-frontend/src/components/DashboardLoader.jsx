import { useEffect } from 'react';
import { getCurrentUserRole } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import Spinner from './Spinner';

const DashboardLoader = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectUser = async () => {
      try {
        const role = await getCurrentUserRole();

        switch (role) {
          case 'ADMIN':
            navigate('/admin-dashboard');
            break;
          case 'MANAGER':
            navigate('/manager-dashboard');
            break;
          case 'EMPLOYEE':
            navigate('/employee-dashboard');
            break;
          default:
            navigate('/unauthorized');
        }
      } catch (err) {
        console.error('Redirection error:', err);
        navigate('/login');
       }
      }
        redirectUser();
      }, [navigate]);

     return <Spinner />;
};

export default DashboardLoader;
