

// Studio
import { db } from "../app";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, increment, query, where } from "firebase/firestore";

import { generateMemorablePIN, generateRandomString, toKebabCase, toTitleCase} from "../../utils/stringUtils";
import { isProduction } from "../../analytics/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCurrentSubscription } from "../../app/slices/studioSlice";
import { changeSubscriptionPlan, createInvoice } from "./subscription";
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
    const buckets = ['gs://fotoflow-india-1', 'gs://fotoflow-india-2'];
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

    const trialPeriodDays = selectedPlan.pricing.trialPeriodDays || 0;

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
    const querySnapshot = await getDocs(usersCollection);
    const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    const user = usersData.find((user) => user.email === email);
    const studio = user?.studio
    return studio;
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

        let totalProjects = 0;
        let totalCollections = 0;
        let totalPhotos = 0;
        let totalFileSize = 0;

        const studioPerformance = [];

        for (const studio of studios) {
            const projectsCollection = collection(db, 'studios', studio.domain, 'projects');
            const projectsSnapshot = await getDocs(projectsCollection);
            const projectsCount = projectsSnapshot.size;
            totalProjects += projectsCount;

            let studioCollections = 0;
            let studioPhotos = 0;
            let studioSize = 0;

            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                studioSize += projectData.totalFileSize || 0;
                studioPhotos += projectData.uploadedFilesCount || 0;

                const collectionsCollection = collection(projectDoc.ref, 'collections');
                const collectionsSnapshot = await getDocs(collectionsCollection);
                studioCollections += collectionsSnapshot.size;
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
                storageUsed: studioSize
            });
        }

        const avgProjectsPerStudio = studios.length ? totalProjects / studios.length : 0;
        const avgCollectionsPerProject = totalProjects ? totalCollections / totalProjects : 0;
        const avgPhotosPerCollection = totalCollections ? totalPhotos / totalCollections : 0;
        const avgPhotosPerProject = totalProjects ? totalPhotos / totalProjects : 0;
        const avgFileSize = totalPhotos ? (totalFileSize / totalPhotos) : 0; // Average photo size in MB

        return {
            summary: {
                totalStudios: studios.length,
                totalProjects,
                totalCollections,
                totalPhotos,
                totalFileSize, // In MB
                avgProjectsPerStudio,
                avgCollectionsPerProject,
                avgPhotosPerCollection,
                avgPhotosPerProject,
                avgFileSize
            },
            studioPerformance
        };
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        throw error;
    }
};