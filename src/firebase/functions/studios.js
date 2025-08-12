import { db, storage } from "../app";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, increment} from "firebase/firestore";

import { generateMemorablePIN, generateRandomString, toKebabCase, toTitleCase} from "../../utils/stringUtils";
import { isProduction } from "../../analytics/utils";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCurrentSubscription } from "../../app/slices/studioSlice";
import { changeSubscriptionPlan, createInvoice } from "./subscription";
import { version } from "jszip";



// Studio
export const createStudio = async (studioData) => {
    const { name, domain } = studioData; // Assuming domain is provided
    const id = `${name.toLowerCase().replace(/\s/g, '-')}-${generateRandomString(5)}`;
    const currentDate = new Date().toISOString().split('T')[0];
    const subscriptionId = `${id}-core-free-${currentDate}`;

    const studiosCollection = collection(db, 'studios');

    // Studio document
    const studioDoc = {
        id: id,
        name: name,
        domain: domain,
        planName: 'Core',
        status: 'active',
        batch: '002',
        usage: {
            storage: {
                quota: 5 * 1000, // 5 GB
                used: 0,         // 0 GB
            },
            projects: {
                weeklyUsed: 0,
                monthlyUsed: 0,
            },
        },
        subscriptionId: subscriptionId,
        subscriptionHistory: [subscriptionId],
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: id,
            updatedBy: id,
            version: 2
        },
        trialEndDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    // Subscription document
    const subscriptionDoc = {
        id: subscriptionId,
        studioId: domain,
        plan: {
            planId: 'core-free',
            name: 'Core',
            type: 'free',
        },
        billing: {
            billingCycle: 'yearly',
            autoRenew: true,
            paymentRecived: false,
            paymentPlatform: null,
            paymentMethod: null,
        },
        dates: {
            startDate: currentDate,
            endDate: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        pricing: {
            basePrice: 0,
            discount: 0,
            tax: 0,
            currency: 'INR',
            totalPrice: 0,
        },
        status: 'active',
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: id,
            updatedBy: id,
        },
    };

    // Create invoice for the free plan
    const invoiceId = await createInvoice(
        id,
        { name: 'Core', type: 'free' }, // Simplified plan object for invoice
        subscriptionId,
        0, // Amount is 0 for free plan
        'yearly',
        'paid' // Marked as paid since it's free
    );

    // Add invoiceId to subscription document
    subscriptionDoc.invoiceId = invoiceId;
    subscriptionDoc.invoiceHistory = [invoiceId];

    // Save documents
    const studioRef = doc(studiosCollection, studioDoc.domain);
    const subscriptionRef = doc(collection(db, 'subscriptions'), subscriptionDoc.id);
    const invoiceRef = doc(collection(db, 'invoices'), invoiceId);

    try {
        await setDoc(studioRef, studioDoc);
        await setDoc(subscriptionRef, subscriptionDoc);
        console.log('Studio, subscription, and invoice created successfully.');
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
    !isProduction ? console.log(studio):console.log('**** Protected data')
    return studio;
};