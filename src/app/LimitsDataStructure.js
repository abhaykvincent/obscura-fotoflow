
const plans={

    free: {
        type: 'free',
        name: 'Core',
        projects: {
            weekly: 2,
            monthly: 5
        },
        collections: {
            perProject:  3,
        },
        images: {
            perCollection: 1000 
        }
    },

    freelancer: {
        type: 'paid',
        name: 'Freelancer',
        projects: {
            weekly: 4,
            monthly: 10
        },
        collections: {
            perProject: 5,  
        },
        images: {
            perCollection: 2000 
        }
    },

    /* studio:{
        type: 'paid',
        name: 'Studio',
        projects: {
            weekly: 8,
            monthly: 20
        },
        collections: {
            perProject:  10,
        },
        images: {
            perCollection: 5000
        }
    }, */

    principle:{
        type: 'principle',
        name: 'Principle User',
        projects: {
            weekly: 12,
            monthly: 31
        },
        collections: {
            perProject:  20,
        },
        images: {
            perCollection: 5000
        }
    }

}

const plan = {
    name: 'freelancer-0.1TB',
    status: 'active',
    storage: {
        quota: 100*1000, // 100 GB
        used: 229868, // 23 GB
    },
    projects: {
        weeklyUsed: 2,
        monthlyUsed: 5,
    },
    policy:{
        weeklyReset: 'sunday',
        monthlyReset: 'firstDayOfMonth'
    },
}

const subscriptions = [
    {
        plan: 'free',
        type: 'monthly-0.05TB',
        price: 0,
        currency: 'INR',
        interval: 'month',

        status: 'archived',
        billingPeriod:[
            {
                billId: 'may-2023',
                status: 'trial',
                amount: 0,
                discount:0,
                startDate: '2023-05-15',
                endDate: '2023-06-15',
                paidAt: '2023-06-15',
            },
            {
                billId: 'august-2023',
                status: 'trial',
                amount: 0,
                discount:0,
                startDate: '2023-06-15',
                endDate: '2023-07-15',
                paidAt: '2023-07-15',
            },
            {
                billId: 'july-2023',
                status: 'trial',
                amount: 0,
                discount: 0,
                startDate: '2023-07-15',
                endDate: '2023-08-15',
                paidAt: '2023-08-15',
            }
        ],
        startDate: '2023-05-15',
        endDate: '2023-08-15',
        planTenure: 3

        

    },
    {
        plan: 'freelancer',
        type: 'monthly-0.1TB',
        price: 1000,
        currency: 'INR',
        interval: 'month',

        status: 'active',
        billingPeriod:[
            {
                billId: 'august-2023',
                status: 'trial',
                amount: 0,
                discount:0,
                startDate: '2023-08-15',
                endDate: '2023-08-30',
                paidAt: null,
            },
            {
                billId: 'september-2023',
                status: 'unpaid',
                amount: 1000,
                discount: 500,
                startDate: '2023-08-30',
                endDate: '2023-09-30',
                paidAt: null,
            },
            {
                billId: 'october-2023',
                status: 'upcoming',
                amount: 1000,
                discount: 0,
                startDate: '2023-08-30',
                endDate: null,
                paidAt: null,
            }
        ],
        startDate: '2023-08-15',
        endDate: null,
        planTenure: null

    }
]


