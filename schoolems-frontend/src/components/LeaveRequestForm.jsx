// src/components/LeaveRequestForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createLeaveRequest } from '../services/api';

const LeaveRequestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await createLeaveRequest(formData);
        toast.success('Leave request submitted successfully');
        setFormData({type: '', startDate: '', endDate:'', reason:''});
        navigate('/leave-requests');
       } catch(err){
           console.error('Submit error:', err);
           toast.error('Error submitting leave request');
       } finally {
           setIsSubmitting(false);
       }
      };

  return (
    <div className="container mt-4">
      <h2>Submit Leave Request</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Leave Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="form-control"
            required
          >
          <option value ="">Select Type</option>
          <option value ="SICK">Sick Leave</option>
          <option value ="VACATION">Vacation Leave</option>
          </select>
        </div>
        <div className="mb-3">
          <label>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label>End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label>Reason</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default LeaveRequestForm;
