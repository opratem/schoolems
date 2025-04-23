import { useState, useEffect, useCallback } from 'react';
import {
    fetchAllLeaveRequests,
    fetchMyLeaveRequests,
    createLeaveRequest,
    updateLeaveStatus,
    deleteLeaveRequest
}   from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';

const useLeaveRequests = () => {
    const { role } = useAuth();

    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
    });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data =
            role === 'ADMIN' || role ==='MANAGER'
                ? await fetchAllLeaveRequests()
                : await fetchMyLeaveRequests();
            setLeaveRequests(data);
        } catch (err) {
            setError('Failed to fetch leave requests');
            toast.error('Failed to load leave requests');
        } finally{
            setLoading(false);
        }
    }, [role]);

    const submitLeave = async (formData) => {
        setSubmitting(true);
        try{
            await createLeaveRequest(formData);
            toast.success('Leave request submitted');
            await fetchRequests();
        } catch (err) {
            toast.error('Failed to submit leave request');
        } finally {
            setSubmitting(false);
        }
    }

    const changeStatus = async (id, status) => {
        try {
            await updateLeaveStatus(id, status);
            toast.success(`Leave request ${status.toLowerCase()}!`);
            await fetchRequests();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const removeRequest = async (id) => {
        try {
            await deleteLeaveRequest(id);
            toast.success('Leave request deleted');
            await fetchRequests();
        } catch (err) {
            toast.error('Failed to delete leave request');
        }
    };

    useEffect(() => {
        if (role) {
            fetchRequests();
        }
    }, [fetchRequests, role]);

    //Filtered requests based on filters
    const filteredRequests = leaveRequests.filter((req) => {
        const matchesStatus = !filters.status || req.status === filters.status;
        const matchesSearch =
            !filters.search ||
            req.employee?.name?.toLowerCase().includes(filters.search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return {
        leaveRequests: filteredRequests,
        loading,
        submitting,
        error,
        filters,
        setFilters,
        fetchRequests,
        submitLeave,
        changeStatus,
        removeRequest
    };
};

export default useLeaveRequests;
