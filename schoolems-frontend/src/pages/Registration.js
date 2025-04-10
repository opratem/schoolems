import { useState } from 'react';
import { register } from '../services/api';
import { useNavigate } from 'react-router-dom';

function Registration() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'EMPLOYEE'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/login');}
        }catch (error){
            if(error.response && error.response.status === 400) {
                setError(error.response.data.message || "Validation failed");
            }else{
                setError("Registration failed. Please try again");
            }
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
            />
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password(min 7 characters)"
                required
            />
            <select
                name="role"
                value={formData.role}
                onChange{handleChange}
            >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <<option value="ADMIN">Admin</option>
            </select>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">Register</button>
        </form>
    );
}

export default Registration;


