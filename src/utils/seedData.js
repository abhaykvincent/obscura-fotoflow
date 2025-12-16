import { db } from "../firebase/app";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

const seedPricingData = async () => {
    if (process.env.NODE_ENV !== 'development') {
        console.log("Not in development environment, skipping data seeding.");
        return;
    }

    console.log("Attempting to seed pricing data...");

    const pricingGroupsRef = collection(db, "pricing");

    const customPricingGroups = [
        {
            id: 'BP001',
            name: 'Business Plan 001',
            sortOrder: 100,
            plans: [
                {
                    id: `plan_bp001_1`,
                    name: 'BP001 Basic',
                    slug: 'bp001-basic',
                    type: 'custom',
                    status: 'active',
                    sortOrder: 1,
                    pricing: {
                        currency: 'INR',
                        tiers: [
                            { interval: 'month', price: 1599, razorpayPlanId: 'rzp_plan_bp001_basic_month' },
                            { interval: 'year', price: 15000, razorpayPlanId: 'rzp_plan_bp001_basic_year' }
                        ],
                        trialPeriodDays: 0,
                        setupFee: 0
                    },
                    limits: {
                        storageGb: 2000, // 2TB
                        maxProjects: -1,
                        maxGalleries: -1,
                        maxTeamMembers: 5,
                        fileUploadSizeMb: 5000,
                        bandwidthGb: -1
                    },
                    features: {
                        permissions: {
                            canRemoveBranding: true,
                            canUseCustomDomain: true,
                            hasApiAccess: true,
                            hasPrioritySupport: true,
                            allowVideoUploads: true
                        },
                        displayList: [{ text: '2TB Storage' }, { text: 'Unlimited Projects' }, { text: '5 Team Members' }]
                    },
                    ui: {
                        colorTheme: '#4f46e5',
                        badgeText: 'Custom Plan',
                        highlight: false,
                        ctaText: 'Contact Sales'
                    },
                    active: true
                },
                {
                    id: `plan_bp001_2`,
                    name: 'BP001 Pro',
                    slug: 'bp001-pro',
                    type: 'custom',
                    status: 'active',
                    sortOrder: 2,
                    pricing: {
                        currency: 'INR',
                        tiers: [
                            { interval: 'month', price: 2999, razorpayPlanId: 'rzp_plan_bp001_pro_month' },
                            { interval: 'year', price: 29000, razorpayPlanId: 'rzp_plan_bp001_pro_year' }
                        ],
                        trialPeriodDays: 0,
                        setupFee: 0
                    },
                    limits: {
                        storageGb: 5000, // 5TB
                        maxProjects: -1,
                        maxGalleries: -1,
                        maxTeamMembers: 10,
                        fileUploadSizeMb: 10000,
                        bandwidthGb: -1
                    },
                    features: {
                        permissions: {
                            canRemoveBranding: true,
                            canUseCustomDomain: true,
                            hasApiAccess: true,
                            hasPrioritySupport: true,
                            allowVideoUploads: true
                        },
                        displayList: [{ text: '5TB Storage' }, { text: 'Unlimited Projects' }, { text: '10 Team Members' }]
                    },
                    ui: {
                        colorTheme: '#10b981',
                        badgeText: 'Most Popular',
                        highlight: true,
                        ctaText: 'Contact Sales'
                    },
                    active: true
                }
            ]
        },
        {
            id: 'BP002',
            name: 'Business Plan 002',
            sortOrder: 101,
            plans: [
                {
                    id: `plan_bp002_1`,
                    name: 'BP002 Starter',
                    slug: 'bp002-starter',
                    type: 'custom',
                    status: 'active',
                    sortOrder: 1,
                    pricing: {
                        currency: 'INR',
                        tiers: [
                            { interval: 'month', price: 999, razorpayPlanId: 'rzp_plan_bp002_starter_month' },
                            { interval: 'year', price: 9000, razorpayPlanId: 'rzp_plan_bp002_starter_year' }
                        ],
                        trialPeriodDays: 0,
                        setupFee: 0
                    },
                    limits: {
                        storageGb: 1000, // 1TB
                        maxProjects: 50,
                        maxGalleries: -1,
                        maxTeamMembers: 3,
                        fileUploadSizeMb: 2000,
                        bandwidthGb: 500
                    },
                    features: {
                        permissions: {
                            canRemoveBranding: false,
                            canUseCustomDomain: false,
                            hasApiAccess: false,
                            hasPrioritySupport: false,
                            allowVideoUploads: false
                        },
                        displayList: [{ text: '1TB Storage' }, { text: '50 Projects' }, { text: '3 Team Members' }]
                    },
                    ui: {
                        colorTheme: '#f59e0b',
                        badgeText: '',
                        highlight: false,
                        ctaText: 'Get Started'
                    },
                    active: true
                }
            ]
        }
    ];

    for (const groupData of customPricingGroups) {
        const q = query(pricingGroupsRef, where("id", "==", groupData.id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(pricingGroupsRef, groupData);
            console.log(`Pricing group '${groupData.name}' (${groupData.id}) added.`);
        } else {
            console.log(`Pricing group '${groupData.name}' (${groupData.id}) already exists, skipping.`);
        }
    }

    console.log("Pricing data seeding process completed.");
    debugger
};

export { seedPricingData };