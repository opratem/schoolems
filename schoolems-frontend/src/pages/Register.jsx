import { useState } from 'react';
import { register } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { setDevelopmentRole } from '../utils/token';
import { toast } from 'react-toastify';

function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        department: '',
        role: 'EMPLOYEE',
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setDevelopmentRole(formData.role);
            await register(formData);
            toast.success("Registration successful!");
            navigate('/login');
        }catch (error) {
            if(error.response?.status === 400) {
                toast.warn(error.response.data.message || "Validation failed");
            }else {
                toast.error("Registration failed. Please try again.");
            }
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="container mt-5" style={{ maxWidth: '500px' }}>
            <h2 className="mb-4 text-center">Register</h2>


        <form onSubmit={handleSubmit}>

            {/* Name */}
        <div className="mb-3">
            <label className="form-label">Name</label>
            <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter your name"
                required
            />
        </div>
        
            {/* Email */}
         <div className="mb-3">
            <label className="form-label">Email</label>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter Email"
                required
            />
            </div>

            {/* Password */}
         <div className="mb-3">
            <label className="form-label">Password</label>
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                placeholder="Password(min 7 characters)"
                required
            />
         </div>

         {/* Department */}
        <div className="mb-4">
            <label className="form-label">Department</label>
            <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-control"
                placeholder="Department"
                required
            />
        </div>


            {/* Role */}
         <div className="mb-4">
            <label className="form-label">Role</label>
            <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-control"
            >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
            </select>
         </div>

            {/*Submit*/}
         <div className="d-grid">
            <button type="submit" className="btn btn-success">
              Register
            </button>
         </div>
      </form>
     </div>
    );
}

export default Register;


