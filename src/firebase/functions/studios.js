

// Studio
import { db } from "../app";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, increment, query, where } from "firebase/firestore";

import { generateMemorablePIN, generateRandomString, toKebabCase, toTitleCase} from "../../utils/stringUtils";
import { isProduction } from "../../analytics/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCurrentSubscription } from "../../app/slices/studioSlice";
import { changeSubscriptionPlan, createInvoice } from "./subscription";
import { restoreProjectFromArchive } from "./project-firestore";
import { version } from "jszip";



// Studio
export const createStudio = async (studioData,user) => {
    const { name, domain } = studioData; // Assuming domain is provided
    const id = `${name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
    const currentDate = new Date();
    const currentDateISO = currentDate.toISOString().split('T')[0];

    const studiosCollection = collection(db, 'studios');
    const pricingGroupsCollection = collection(db, 'pricingGroups');

    // Determine bucket for 50-50 split
    const snapshot = await getDocs(studiosCollection);
    const studioCount = snapshot.size;
    const buckets = ['gs://fotoflow-india-1', 'gs://fotoflow-india-2']
    const bucketUrl = buckets[studioCount % 2];
    
    // Determine which pricing group to use
    const targetGroupTag = (studioCount % 2) + 1 === 1 ? 'BP001' : 'BP002';
    
    // Fetch pricing groups
    const pricingGroupsQuery = query(pricingGroupsCollection, where("id", "in", ["BP001", "BP002"]));
    const pricingGroupsSnapshot = await getDocs(pricingGroupsQuery);
    const pricingGroups = pricingGroupsSnapshot.docs.map(doc => doc.data());

    const targetGroup = pricingGroups.find(group => group.id === targetGroupTag);

    if (!targetGroup || targetGroup.plans.length === 0) {
        console.error(`Pricing group ${targetGroupTag} not found or has no plans.`);
        throw new Error(`Pricing group ${targetGroupTag} not found or has no plans.`);
    }

    // Select the first plan from the target group
    const selectedPlan = targetGroup.plans[0];
    const monthlyTier = selectedPlan.pricing.tiers.find(tier => tier.interval === 'month');
    const yearlyTier = selectedPlan.pricing.tiers.find(tier => tier.interval === 'year');

    const trialPeriodDays = selectedPlan.pricing.trialPeriodDays || 14;

    const trialEndDate = new Date(currentDate.getTime() + trialPeriodDays * 24 * 60 * 60 * 1000);
    const subscriptionEndDate = new Date(currentDate.getTime() + (monthlyTier ? 30 : 365) * 24 * 60 * 60 * 1000); // Assuming monthly if available, else yearly

    // Studio document
    const studioDoc = {
        id: id,
        name: name,
        domain: domain,
        ownerId:user.email,
        bucketUrl: bucketUrl,
        userBatch: (studioCount % 2)+1,
        planName: selectedPlan.name,
        status: 'active', // Can be 'trialing' if trial period is active
        batch: targetGroupTag, // Use the BP tag as the batch
        usage: {
            storage: {
                quota: selectedPlan.limits.storageGb * 1000, // Convert GB to MB
                used: 0,
            },
            projects: {
                monthlyQuota: selectedPlan.limits.maxProjects,
                monthlyUsed: 0,
            },
            collections:{
                quota: selectedPlan.limits.maxGalleries
            }
        },
        billing: {
            razorpayCustomerId: null,
            razorpaySubscriptionId: null,
            planId: monthlyTier?.razorpayPlanId || yearlyTier?.razorpayPlanId || null,
            status: trialPeriodDays > 0 ? 'trialing' : 'active',
            currentPeriodEnd: subscriptionEndDate.toISOString().split('T')[0],
            trialEnd: trialEndDate.toISOString().split('T')[0],
            cancelAtPeriodEnd: false, // Default to not cancelling at period end
            quantity: 1,
            subscriptionHistory: [], // Will be populated below
        },
        subscriptionId: '', // Will be populated below
        metadata: {
            createdAt: currentDateISO,
            updatedAt: currentDateISO,
            createdBy: id,
            updatedBy: id,
            version: 2
        },
        trialEndDate: trialEndDate.toISOString().split('T')[0],
    };

    const newSubscriptionId = `${id}-${selectedPlan.slug}-${currentDateISO}`;
    studioDoc.subscriptionId = newSubscriptionId;
    studioDoc.billing.subscriptionHistory.push(newSubscriptionId);

    // Subscription document
    const subscriptionDoc = {
        id: newSubscriptionId,
        studioId: domain,
        plan: {
            planId: selectedPlan.id,
            name: selectedPlan.name,
            type: selectedPlan.type,
        },
        billing: {
            billingCycle: monthlyTier ? 'monthly' : (yearlyTier ? 'yearly' : 'one-time'),
            autoRenew: true,
            paymentRecived: false,
            paymentPlatform: null,
            paymentMethod: null,
        },
        dates: {
            startDate: currentDateISO,
            endDate: subscriptionEndDate.toISOString().split('T')[0],
        },
        pricing: {
            basePrice: monthlyTier?.price || yearlyTier?.price || 0,
            discount: 0,
            tax: 0,
            currency: selectedPlan.pricing.currency,
            totalPrice: monthlyTier?.price || yearlyTier?.price || 0,
        },
        status: trialPeriodDays > 0 ? 'trialing' : 'active',
        metadata: {
            createdAt: currentDateISO,
            updatedAt: currentDateISO,
            createdBy: id,
            updatedBy: id,
        },
    };

    // Create invoice for the selected plan
    const invoiceId = await createInvoice(
        id,
        { name: selectedPlan.name, type: selectedPlan.type },
        newSubscriptionId,
        subscriptionDoc.pricing.totalPrice,
        subscriptionDoc.billing.billingCycle,
        trialPeriodDays > 0 ? 'pending' : 'paid' // Invoice pending during trial, paid otherwise
    );

    // Add invoiceId to subscription document
    subscriptionDoc.invoiceId = invoiceId;
    subscriptionDoc.invoiceHistory = [invoiceId];

    // Save documents
    const studioRef = doc(studiosCollection, studioDoc.domain);
    const subscriptionRef = doc(collection(db, 'subscriptions'), subscriptionDoc.id);

    try {
        await setDoc(studioRef, studioDoc);
        await setDoc(subscriptionRef, subscriptionDoc);
        console.log(`Studio '${studioDoc.name}', subscription '${subscriptionDoc.id}', and invoice '${invoiceId}' created successfully.`);
        return { 
            studio: studioDoc, 
            subscription: subscriptionDoc,
            invoiceId: invoiceId 
        };
    } catch (error) {
        console.error('Error creating studio, subscription, or invoice:', error.message);
        throw error;
    }
};

export const checkStudioDomainAvailability = async (domain) => {

    console.log("Checking domain availability for:", domain);
    const studiosCollection = collection(db, 'studios');
    const querySnapshot = await getDocs(studiosCollection);
    const studiosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    const studio = studiosData.find((studio) => studio.domain === domain);

    return !studio;
};
export const fetchStudiosOfUser = async (email) => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return [];
    }

    const user = querySnapshot.docs[0].data();
    
    if (user?.studios) {
        return user.studios;
    }
    
    // Fallback for old structure
    return user?.studio ? [user.studio] : [];
};
export const fetchStudios = async () => {
    const studiosCollection = collection(db, 'studios');
    const querySnapshot = await getDocs(studiosCollection);
    const studiosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    return studiosData;
}

export const fetchStudioByDomain = async (currentDomain) => {
    const studiosCollection = collection(db, 'studios');
    const querySnapshot = await getDocs(studiosCollection);
    const studiosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    const studio = studiosData.find((studio) => studio.domain === currentDomain);
    if(!isProduction){
        let color = studio ? '#b3d6e4ff' : 'gray';
        console.log(`%c 💻 ------- Developer only -------`, `color: ${color};`);
        console.log(`%c 🔥 Studio`, `color: ${color}; font-weight: bold;`,studio);


    }
    return studio;
}
export const updateGalleryTagline = async (studioId, galleryTagline) => {
    try {
        const studioRef = doc(db, 'studios', studioId);
        await updateDoc(studioRef, {
            'settings.gallery.galleryTagline': galleryTagline,
            'metadata.updatedAt': new Date().toISOString(),
        });
        console.log(`Gallery tagline for studio ${studioId} updated successfully.`);
        return true;
    } catch (error) {
        console.error(`Error updating gallery tagline for studio ${studioId}:`, error.message);
        throw error;
    }
};

export const updateStudioLogo = async (studioId, logoUrl) => {
    try {
        const studioRef = doc(db, 'studios', studioId);
        await updateDoc(studioRef, {
            'studioLogo': logoUrl,
            'metadata.updatedAt': new Date().toISOString(),
        });
        console.log(`Logo for studio ${studioId} updated successfully.`);
        return true;
    } catch (error) {
        console.error(`Error updating logo for studio ${studioId}:`, error.message);
        throw error;
    }
};

export const updateStudio = async (studioId, updates) => {
    try {
        const studioRef = doc(db, 'studios', studioId);
        const updateData = {
            ...updates,
            'metadata.updatedAt': new Date().toISOString(),
        };
        await updateDoc(studioRef, updateData);
        console.log(`Studio ${studioId} updated successfully with:`, updates);
        return true;
    } catch (error) {
        console.error(`Error updating studio ${studioId}:`, error.message);
        throw error;
    }
};

export const fetchAnalyticsData = async () => {
    try {
        const studiosCollection = collection(db, 'studios');
        const studiosSnapshot = await getDocs(studiosCollection);
        const studios = studiosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let totalProjects = 0;
        let totalCollections = 0;
        let totalPhotos = 0;
        let totalFileSize = 0;
        let completedProjects = 0;
        let activeStudiosCount = 0;
        let totalTTFU = 0;
        let ttfuCount = 0;

        const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        const studioPerformance = [];

        for (const studio of studios) {
            const projectsCollection = collection(db, 'studios', studio.domain, 'projects');
            const projectsSnapshot = await getDocs(projectsCollection);
            const projectsCount = projectsSnapshot.size;
            totalProjects += projectsCount;

            let studioCollections = 0;
            let studioPhotos = 0;
            let studioSize = 0;
            let studioIsActive = false;
            let firstProjectDate = null;

            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                studioSize += projectData.totalFileSize || 0;
                studioPhotos += projectData.uploadedFilesCount || 0;

                // Track activity (upload or open in last 14 days)
                if ((projectData.lastOpened || 0) > fourteenDaysAgo || (projectData.createdAt || 0) > fourteenDaysAgo) {
                    studioIsActive = true;
                }

                // Track completion (selected or completed status)
                if (['selected', 'completed'].includes(projectData.status)) {
                    completedProjects++;
                }

                // Track first project for TTFU
                if (!firstProjectDate || projectData.createdAt < firstProjectDate) {
                    firstProjectDate = projectData.createdAt;
                }

                const collectionsCollection = collection(projectDoc.ref, 'collections');
                const collectionsSnapshot = await getDocs(collectionsCollection);
                studioCollections += collectionsSnapshot.size;
            }

            if (studioIsActive) activeStudiosCount++;

            // Calculate TTFU for this studio owner
            const owner = users.find(u => u.email === studio.ownerId);
            if (owner && owner.createdAt && firstProjectDate) {
                const diff = (firstProjectDate - owner.createdAt) / (1000 * 60 * 60); // Hours
                if (diff > 0) {
                    totalTTFU += diff;
                    ttfuCount++;
                }
            }

            totalCollections += studioCollections;
            totalPhotos += studioPhotos;
            totalFileSize += studioSize;

            studioPerformance.push({
                id: studio.id,
                name: studio.name,
                domain: studio.domain,
                projectsCount,
                collectionsCount: studioCollections,
                photosCount: studioPhotos,
                storageUsed: studioSize,
                isActive: studioIsActive,
                // Per-studio metrics
                avgPhotosPerProject: projectsCount ? studioPhotos / projectsCount : 0,
                avgStoragePerProject: projectsCount ? studioSize / projectsCount : 0,
                avgPhotosPerCollection: studioCollections ? studioPhotos / studioCollections : 0,
                avgSizePerPhoto: studioPhotos ? studioSize / studioPhotos : 0
            });
        }

        // Infrastructure Cost Constants (Firebase Estimates)
        const STORAGE_COST_PER_GB = 0.026;
        const totalGB = totalFileSize / 1024;
        const estimatedMonthlyBurn = totalGB * STORAGE_COST_PER_GB;

        const avgProjectsPerStudio = studios.length ? totalProjects / studios.length : 0;
        const avgTTFU = ttfuCount ? totalTTFU / ttfuCount : 0;
        const projectCompletionRate = totalProjects ? (completedProjects / totalProjects) * 100 : 0;
        const avgCollectionsPerProject = totalProjects ? totalCollections / totalProjects : 0;
        const avgPhotosPerCollection = totalCollections ? totalPhotos / totalCollections : 0;
        const avgPhotosPerProject = totalProjects ? totalPhotos / totalProjects : 0;

        return {
            summary: {
                totalStudios: studios.length,
                totalProjects,
                totalCollections,
                totalPhotos,
                totalFileSize,
                activeStudios: activeStudiosCount,
                dormantStudios: studios.length - activeStudiosCount,
                avgProjectsPerStudio,
                avgTTFU,
                projectCompletionRate,
                estimatedMonthlyBurn,
                avgCollectionsPerProject,
                avgPhotosPerCollection,
                avgPhotosPerProject,
                storageEfficiency: totalPhotos ? (totalFileSize / totalPhotos) : 0, // MB per photo
            },
            leaderboard: [...studioPerformance].sort((a, b) => b.storageUsed - a.storageUsed).slice(0, 10),
            studioPerformance
        };
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        throw error;
    }
};

// Selection Requests
export const createSelectionRequest = async (domain, projectId, projectName) => {
    try {
        const studioRef = doc(db, 'studios', domain);
        const selectionRequestsRef = collection(studioRef, 'selectionRequests');
        const requestDoc = {
            projectId,
            projectName,
            status: 'pending',
            requestedAt: Date.now(),
        };
        await setDoc(doc(selectionRequestsRef, projectId), requestDoc);
        console.log(`Selection reset request created for project ${projectId}`);
        return requestDoc;
    } catch (error) {
        console.error('Error creating selection request:', error);
        throw error;
    }
};

export const fetchSelectionRequests = async (domain) => {
    try {
        const studioRef = doc(db, 'studios', domain);
        const selectionRequestsRef = collection(studioRef, 'selectionRequests');
        const q = query(selectionRequestsRef, where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching selection requests:', error);
        throw error;
    }
};

export const approveSelectionRequest = async (domain, projectId) => {
    try {
        const studioRef = doc(db, 'studios', domain);
        const selectionRequestsRef = collection(studioRef, 'selectionRequests');
        const requestRef = doc(selectionRequestsRef, projectId);
        
        // Update request status
        await updateDoc(requestRef, { status: 'accepted', acceptedAt: Date.now() });
        
        // Update project status back to active to allow re-selection
        const projectRef = doc(db, 'studios', domain, 'projects', projectId);
        await updateDoc(projectRef, { status: 'active' });
        
        console.log(`Selection reset request approved for project ${projectId}`);
        return true;
    } catch (error) {
        console.error('Error approving selection request:', error);
        throw error;
    }
};

export const declineSelectionRequest = async (domain, projectId) => {
    try {
        const studioRef = doc(db, 'studios', domain);
        const selectionRequestsRef = collection(studioRef, 'selectionRequests');
        const requestRef = doc(selectionRequestsRef, projectId);
        
        // Update request status to declined
        await updateDoc(requestRef, { status: 'declined', declinedAt: Date.now() });
        
        console.log(`Selection reset request declined for project ${projectId}`);
        return true;
    } catch (error) {
        console.error('Error declining selection request:', error);
        throw error;
    }
};

// Extension Requests
export const createExtensionRequest = async (domain, projectId, projectName) => {
    try {
        const studioRef = doc(db, 'studios', domain);
        const extensionRequestsRef = collection(studioRef, 'extensionRequests');
        const requestDoc = {
            projectId,
            projectName,
            status: 'pending',
            requestedAt: Date.now(),
        };
        await setDoc(doc(extensionRequestsRef, projectId), requestDoc);
        console.log(`Extension request created for project ${projectId}`);
        return requestDoc;
    } catch (error) {
        console.error('Error creating extension request:', error);
        throw error;
    }
};

export const fetchExtensionRequests = async (domain) => {
    try {
        const studioRef = doc(db, 'studios', domain);
        const extensionRequestsRef = collection(studioRef, 'extensionRequests');
        const q = query(extensionRequestsRef, where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching extension requests:', error);
        throw error;
    }
};

export const approveExtensionRequest = async (domain, projectId) => {
    try {
        const studioRef = doc(db, 'studios', domain);
        const extensionRequestsRef = collection(studioRef, 'extensionRequests');
        const requestRef = doc(extensionRequestsRef, projectId);
        
        await updateDoc(requestRef, { status: 'accepted', acceptedAt: Date.now() });
        
        const projectRef = doc(db, 'studios', domain, 'projects', projectId);

        // Check if project is archived and restore if necessary
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            const projectData = projectSnap.data();
            const isArchived = projectData.status === 'archive' || projectData.storage?.status === 'archive';
            
            if (isArchived) {
                await restoreProjectFromArchive(domain, projectId);
            }
            
            let newValidity;
            let newThreshold;
            const createdAt = new Date(projectData.createdAt);

            if (isArchived) {
                // Find when it was archived
                const archivedDateMs = projectData.storage?.storageHistory?.filter(h => h.status === 'archive').pop()?.dateMoved || Date.now();
                const archivedDate = new Date(archivedDateMs);
                
                // New threshold is 6 months from archived date
                const targetThresholdDate = new Date(archivedDate);
                targetThresholdDate.setMonth(targetThresholdDate.getMonth() + 6);
                newThreshold = targetThresholdDate.getTime();

                // Calculate total validity months from createdAt to new threshold
                const diffYears = targetThresholdDate.getFullYear() - createdAt.getFullYear();
                const diffMonths = targetThresholdDate.getMonth() - createdAt.getMonth();
                newValidity = (diffYears * 12) + diffMonths;
            } else {
                // Default: increment existing validity by 3
                const currentValidity = parseInt(projectData.projectValidityMonths || '6');
                newValidity = currentValidity + 3;
                
                const targetThresholdDate = new Date(createdAt);
                targetThresholdDate.setMonth(targetThresholdDate.getMonth() + newValidity);
                newThreshold = targetThresholdDate.getTime();
            }
            
            const updates = {
                projectValidityMonths: newValidity
            };

            // Update archiveThreshold if it exists or if we are restoring
            if (projectData.storage?.archiveThreshold || isArchived) {
                updates['storage.archiveThreshold'] = newThreshold;
            }

            await updateDoc(projectRef, updates);
        }
        
        console.log(`Extension request approved for project ${projectId}.`);
        return true;
    } catch (error) {
        console.error('Error approving extension request:', error);
        throw error;
    }
};

export const declineExtensionRequest = async (domain, projectId) => {
    try {
        const studioRef = doc(db, 'studios', domain);
        const extensionRequestsRef = collection(studioRef, 'extensionRequests');
        const requestRef = doc(extensionRequestsRef, projectId);
        
        await updateDoc(requestRef, { status: 'declined', declinedAt: Date.now() });
        
        console.log(`Extension request declined for project ${projectId}`);
        return true;
    } catch (error) {
        console.error('Error declining extension request:', error);
        throw error;
    }
};

/**
 * Fetches comprehensive serializable data for a single studio profile.
 * @param {string} studioIdentifier - Domain, ID, or Name of the studio.
 * @returns {Promise<object|null>} Complete structured studio profile details.
 */
export const fetchStudioProfileData = async (studioIdentifier) => {
    if (!studioIdentifier) return null;

    try {
        const studiosCollection = collection(db, 'studios');
        let studioData = null;

        // Try direct document lookup by domain or id
        const studioDocRef = doc(db, 'studios', studioIdentifier);
        const studioDocSnap = await getDoc(studioDocRef);

        if (studioDocSnap.exists()) {
            studioData = { id: studioDocSnap.id, ...studioDocSnap.data() };
        } else {
            // Query by domain
            const qDomain = query(studiosCollection, where('domain', '==', studioIdentifier));
            const domainSnap = await getDocs(qDomain);
            if (!domainSnap.empty) {
                studioData = { id: domainSnap.docs[0].id, ...domainSnap.docs[0].data() };
            } else {
                // Query by ID
                const qId = query(studiosCollection, where('id', '==', studioIdentifier));
                const idSnap = await getDocs(qId);
                if (!idSnap.empty) {
                    studioData = { id: idSnap.docs[0].id, ...idSnap.docs[0].data() };
                } else {
                    // Fallback scan by name / domain insensitive
                    const allSnap = await getDocs(studiosCollection);
                    const match = allSnap.docs.find(d => {
                        const data = d.data();
                        return (
                            (data.name && data.name.toLowerCase() === studioIdentifier.toLowerCase()) ||
                            (data.domain && data.domain.toLowerCase() === studioIdentifier.toLowerCase())
                        );
                    });
                    if (match) {
                        studioData = { id: match.id, ...match.data() };
                    }
                }
            }
        }

        if (!studioData) return null;

        const domain = studioData.domain || studioData.id;

        // Fetch projects for this studio
        let projects = [];
        let totalPhotosCount = 0;
        let totalStorageUsed = 0;
        let activeProjectsCount = 0;
        let archivedProjectsCount = 0;
        let completedProjectsCount = 0;

        try {
            const projectsCollectionRef = collection(db, 'studios', domain, 'projects');
            const projectsSnap = await getDocs(projectsCollectionRef);

            projects = await Promise.all(
                projectsSnap.docs.map(async (pDoc) => {
                    const pData = pDoc.data();
                    let collectionsCount = 0;
                    try {
                        const collsSnap = await getDocs(collection(pDoc.ref, 'collections'));
                        collectionsCount = collsSnap.size;
                    } catch (e) {
                        collectionsCount = pData.collections?.length || 0;
                    }

                    const fileSize = pData.totalFileSize || 0;
                    const photoCount = pData.uploadedFilesCount || 0;
                    totalStorageUsed += fileSize;
                    totalPhotosCount += photoCount;

                    if (pData.status === 'archive' || pData.storage?.status === 'archive') {
                        archivedProjectsCount++;
                    } else if (pData.status === 'completed' || pData.status === 'selected') {
                        completedProjectsCount++;
                    } else {
                        activeProjectsCount++;
                    }

                    return {
                        id: pDoc.id,
                        name: pData.name || 'Untitled Project',
                        type: pData.type || 'Standard',
                        status: pData.status || 'draft',
                        createdAt: pData.createdAt ? (typeof pData.createdAt === 'number' ? new Date(pData.createdAt).toISOString() : String(pData.createdAt)) : null,
                        lastOpened: pData.lastOpened ? (typeof pData.lastOpened === 'number' ? new Date(pData.lastOpened).toISOString() : String(pData.lastOpened)) : null,
                        uploadedFilesCount: photoCount,
                        totalFileSize: fileSize,
                        projectValidityMonths: pData.projectValidityMonths || 6,
                        collectionsCount,
                        pin: pData.pin || null,
                        client: pData.client || null,
                    };
                })
            );
        } catch (err) {
            console.error('Error fetching studio projects:', err);
        }

        // Fetch users/members associated with this studio
        let members = [];
        try {
            const usersCollectionRef = collection(db, 'users');
            const usersSnap = await getDocs(usersCollectionRef);
            members = usersSnap.docs
                .map(uDoc => ({ id: uDoc.id, ...uDoc.data() }))
                .filter(user => {
                    if (user.email && studioData.ownerId && user.email.toLowerCase() === studioData.ownerId.toLowerCase()) return true;
                    if (user.studio?.domain === domain || user.studio?.name === studioData.name) return true;
                    if (Array.isArray(user.studios)) {
                        return user.studios.some(s => s.domain === domain || s.id === studioData.id || s.name === studioData.name);
                    }
                    return false;
                })
                .map(user => ({
                    id: user.id,
                    displayName: user.displayName || user.name || 'Anonymous User',
                    email: user.email || 'N/A',
                    role: user.role || (Array.isArray(user.studios) ? user.studios.find(s => s.domain === domain)?.roles?.[0] : null) || (user.email === studioData.ownerId ? 'Owner' : 'Member'),
                    createdAt: user.createdAt ? (typeof user.createdAt === 'number' ? new Date(user.createdAt).toISOString() : String(user.createdAt)) : null,
                }));
        } catch (err) {
            console.error('Error fetching studio members:', err);
        }

        // Fetch selection and extension requests
        let selectionRequests = [];
        let extensionRequests = [];
        try {
            const selReqSnap = await getDocs(collection(db, 'studios', domain, 'selectionRequests'));
            selectionRequests = selReqSnap.docs.map(d => {
                const dData = d.data();
                return {
                    id: d.id,
                    ...dData,
                    requestedAt: dData.requestedAt ? new Date(dData.requestedAt).toISOString() : null,
                    acceptedAt: dData.acceptedAt ? new Date(dData.acceptedAt).toISOString() : null,
                    declinedAt: dData.declinedAt ? new Date(dData.declinedAt).toISOString() : null,
                };
            });

            const extReqSnap = await getDocs(collection(db, 'studios', domain, 'extensionRequests'));
            extensionRequests = extReqSnap.docs.map(d => {
                const dData = d.data();
                return {
                    id: d.id,
                    ...dData,
                    requestedAt: dData.requestedAt ? new Date(dData.requestedAt).toISOString() : null,
                    acceptedAt: dData.acceptedAt ? new Date(dData.acceptedAt).toISOString() : null,
                    declinedAt: dData.declinedAt ? new Date(dData.declinedAt).toISOString() : null,
                };
            });
        } catch (err) {
            console.error('Error fetching studio requests:', err);
        }

        return {
            studio: {
                ...studioData,
                createdAt: studioData.metadata?.createdAt || studioData.createdAt || null,
            },
            stats: {
                totalProjects: projects.length,
                activeProjects: activeProjectsCount,
                archivedProjects: archivedProjectsCount,
                completedProjects: completedProjectsCount,
                totalPhotos: totalPhotosCount,
                totalStorageUsed: totalStorageUsed || studioData.usage?.storage?.used || 0,
                storageQuota: studioData.usage?.storage?.quota || 0,
                totalMembers: members.length,
                pendingRequests: selectionRequests.filter(r => r.status === 'pending').length + extensionRequests.filter(r => r.status === 'pending').length,
            },
            projects,
            members,
            selectionRequests,
            extensionRequests,
        };
    } catch (error) {
        console.error('Error in fetchStudioProfileData:', error);
        throw error;
    }
};