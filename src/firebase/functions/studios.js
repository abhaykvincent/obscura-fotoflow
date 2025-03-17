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
        status: 'active', // Enum: ['active', 'inactive', 'suspended']
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
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: id, // Ideally, should be user ID
            updatedBy: id, // Ideally, should be user ID
        },
    };

    // Subscription document
    const subscriptionDoc = {
        id: subscriptionId,
        studioId: id,
        plan: {
            planId: 'core-free',
            name: 'Core',
            type: 'free', // Enum: ['free', 'paid', 'enterprise']
        },
        billing: {
            billingCycle: 'yearly',
            autoRenew: true,
            paymentPlatform: null, // Enum: ['razorpay']
            paymentMethod: null,   // Enum: ['upi', 'credit-card', 'debit-card', 'net-banking', 'cash']
        },
        dates: {
            startDate: currentDate,
            endDate: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            trialEndDate: null,
        },
        pricing: {
            basePrice: 0,
            discount: 0,
            tax: 0,
            currency: 'INR', // Enum: ['INR', 'USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 'HKD', 'SGD']
            totalPrice: 0,
        },
        status: 'active', // Enum: ['active', 'trial', 'expired', 'canceled']
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: id, // Ideally, should be user ID
            updatedBy: id, // Ideally, should be user ID
        },
    };

    // Save documents
    const studioRef = doc(studiosCollection, studioDoc.domain);
    const subscriptionRef = doc(collection(db, 'subscriptions'), subscriptionDoc.id);

    try {
        await setDoc(studioRef, studioDoc);
        await setDoc(subscriptionRef, subscriptionDoc);
        console.log('Studio and subscription created successfully.');
        return { studio: studioDoc, subscription: subscriptionDoc };
    } catch (error) {
        console.error('Error creating studio or subscription:', error.message);
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

    return studio;
};