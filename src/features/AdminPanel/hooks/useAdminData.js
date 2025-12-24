import { useState, useEffect, useCallback } from 'react';
import { fetchStudios, fetchAnalyticsData } from '../../../firebase/functions/studios';
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
        analytics: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [users, studios, referrals, leads, analytics] = await Promise.all([
                fetchUsers(),
                fetchStudios(),
                fetchAllReferalsFromFirestore(),
                fetchLeads(),
                fetchAnalyticsData()
            ]);
            
            setData({ users, studios, referrals, leads, analytics });
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
