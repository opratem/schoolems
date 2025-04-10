import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchEmployee, saveEmployee, updateEmployee } from '../services/api';
import { isAdmin } from '../services/auth';

const EmployeeForm = ({ isEdit = false }) => {
    const navigate = useNavigate();
    const { id } =  useParams();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department: '',
        position: '',
        phone: '',
        startDate: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userIsAdmin, setUserIsAdmin] = useState(false);

    // Load admin status and employee data (if editing)
    useEffect(() => {
        const loadData = async () => {
            // Check admin status first
            setUserIsAdmin(await isAdmin());

            // Load employee data if in edit mode
            if (isEdit && id) {
                setIsLoading(true);
                try {
                    const employee = await fetchEmployee(id);
                    setFormData(employee);
                } catch (error) {
                    console.error('Error fetching employee:', error);
                    alert(error.response?.data?.message || 'Failed to load employee');
                    navigate('/employees');
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadData();
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!formData.department.trim()) newErrors.department = 'Department is required';
        if (!formData.position.trim()) newErrors.position = 'Position is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            if (isEdit) {
                await updateEmployee(id, formData);
            } else {
                await saveEmployee(formData);
            }
            navigate('/employees');
        } catch (error) {
            console.error('Error saving employee:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert(error.response?.data?.message || 'Failed to save employee');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div>Loading employee data...</div>;

    return (
        <div className="employee-form">
            <h2>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h2>
            {!userIsAdmin && isEdit && (
                <div className="warning">You need admin privileges to edit employees</div>
            )}
            <form onSubmit={handleSubmit}>
                {/* Name Field */}
                <div className="form-group">
                    <label>Full Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? 'error' : ''}
                        placeholder="John Doe"
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                {/* Email Field */}
                <div className="form-group">
                    <label>Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                        placeholder="john@example.com"
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                {/* Department Field */}
                <div className="form-group">
                    <label>Department *</label>
                    <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className={errors.department ? 'error' : ''}
                        placeholder="E.g., IT, Mathematics, Administration"
                    />
                    {errors.department && <span className="error-message">{errors.department}</span>}
                </div>

                {/* Position Field */}
                <div className="form-group">
                    <label>Position *</label>
                    <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className={errors.position ? 'error' : ''}
                        placeholder="E.g., Teacher, Secretary, Accountant"
                    />
                    {errors.position && <span className="error-message">{errors.position}</span>}
                </div>

                {/* Phone Field */}
                <div className="form-group">
                    <label>Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        placeholder="+1234567890"
                    />
                </div>

                {/* Start Date */}
                <div className="form-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate || ''}
                        onChange={handleChange}
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || (isEdit && !userIsAdmin)}
                >
                    {isSubmitting ? 'Saving...' : 'Save Employee'}
                </button>
            </form>
        </div>
    );
};

export default EmployeeForm;