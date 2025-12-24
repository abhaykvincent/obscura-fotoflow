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
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsLastUpdated, setAnalyticsLastUpdated] = useState(null);
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
            
            setData(prev => ({ ...prev, users, studios, referrals, leads }));
            setError(null);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const analytics = await fetchAnalyticsData();
            setData(prev => ({ ...prev, analytics }));
            setAnalyticsLastUpdated(new Date().getTime());
            setError(null);
        } catch (err) {
            console.error('Error fetching analytics data:', err);
            setError(err.message);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return { ...data, loading, analyticsLoading, analyticsLastUpdated, error, refreshData, refreshAnalytics };
};
