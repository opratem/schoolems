import { useState } from 'react';
import { login } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { setToken } from '../utils/token';
import { toast } from 'react-toastify';
import { getCurrentUserRole } from '../services/auth';

function Login() {

  const [credentials, setCredentials] = useState({email: '', password: ''});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);


    try {
      const role = await login({
          email: credentials.email,
          password: credentials.password
      });
      toast.success(`Logged in as ${role}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials');
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '500px' }}>
      <h2 className="text-center mb-4">Login</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="mb-3">
          <label className="form-label">Email </label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials,email:e.target.value})}
            className="form-control"
            placeholder="Enter Email"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials,password:e.target.value})}
              className="form-control"
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="btn btn-outline-secondary"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="d-grid mb-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>

      <p className="text-center">
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login;
