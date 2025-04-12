import { useState, useEffect } from 'react';
import { getCurrentUserRole } from '../services/auth';
import { getToken } from '../utils/token';

export const useAuth = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        if (token) {
            getCurrentUserRole()
                .then((res) => {
                    setRole(res.role);
                })
                .catch((err) => {
                    console.error('Failed to fetch role:', err);
                    setRole(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        }else {
            setLoading(false);
        }
    }, []);

    return { role, loading };
};