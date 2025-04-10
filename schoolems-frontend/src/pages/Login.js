import { useState } from 'react';
import { login } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] =useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const token = await login(email, password);
            localStorage.setItem('token', token); //Store token
            navigate('/employees');//Redirect to employee list
        } catch(error){
         setError("Login failed. Please check your credentials");
        }finally {
            setLoading(false);
        }
    };

    return(
        <div>
          <form onSubmit={handleSubmit}>
           <input
             type= "email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             placeholder= "Email"
             required
        />
           <input
              //type = {showPassword ? "text" : "password"}
              type= "password"
              value= {password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
           />
           {error && <p style={{ color: 'red'}}>{error}</p>} {
           }
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'Hide' : 'Show'}
            </button>
            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <p>
            Dont have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    );
}

export default Login;