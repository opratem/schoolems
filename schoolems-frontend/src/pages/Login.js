import { useState } from 'react';
import { login } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { setToken } from '../utils/token';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] =useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try{
            const token = await login(email, password);
            setToken(token) //Store token
            navigate('/employees');//Redirect to employee list
        } catch(error){
         setError("Login failed. Please check your credentials");
        }finally {
            setLoading(false);
        }
    };

    return(
        <div className="container mt-5" style={{ maxWidth: '500px' }}>
        <h2 className="text-center mb-4">Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/*Email*/}
          <div className="mb-3">
            <label className="form-label">Email address</label>
           <input
             type= "email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             className="form-control"
             placeholder= "Enter Email"
             required
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className= "input-group">
           <input
              type = {showPassword ? "text" : "password"}
              value= {password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/*Submit */}
          <div className="d-grid mb-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <p className="text-center">
            Dont have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    );
}

export default Login;