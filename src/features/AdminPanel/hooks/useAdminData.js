import { useState, useEffect, useCallback } from 'react';
import { fetchStudios } from '../../../firebase/functions/studios';
import { 
    fetchUsers, 
    fetchAllReferalsFromFirestore, 
    fetchLeads 
} from '../../../firebase/functions/firestore';

export const useAdminData = () => {
    const [data, setData] = useState({
        users: [],
        studios: [],
        referrals: [],
        leads: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [users, studios, referrals, leads] = await Promise.all([
                fetchUsers(),
                fetchStudios(),
                fetchAllReferalsFromFirestore(),
                fetchLeads()
            ]);
            
            setData({ users, studios, referrals, leads });
            setError(null);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return { ...data, loading, error, refreshData };
};
