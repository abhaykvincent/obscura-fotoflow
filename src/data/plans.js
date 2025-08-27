export const initialPlans = [
  {
    name: 'Core',
    isCurrentPlan: true,
    pricing: [
      { storage: 5, monthlyPrice: 'Free', yearlyPrice: '₹0', specialOffer: ['for Forever.','No CC Required']},
    ],
    features: ['3 galleries/project','3 new projects/month'],
    coreFeatures: ['5 GB Storage','','Gallery','Selection'],
    expiry: '31 July 2026',
    defaultPlan:0 ,
  },
  {
    name: 'Freelancer',
    pricing: [
      { storage: 100, monthlyPrice: '₹930',monthlyPriceWas: '₹1,300', yearlyPrice: '₹10,000', specialOffer: ['for 12 months','₹100 OFF','Core +'],defaultPlan: true   },
     
    ],
    defaultPlan: 0,
    defaultStorage: 100,
    coreFeatures: ['Gallery','Selection','Financials','e-Invitation'],
    features: [ 'Unlimited Projects','12 Galleries/month','+Everything in Core plan'],
    extraFeatures: {},
  },
  {
    name: 'Studio',
    pricing: [
      { storage: 1024, 
        monthlyPrice: '₹1,300',monthlyPriceWas: '₹2,800', yearlyPrice: '₹25,000', 
        specialOffer: ['for 2 months.','Offer expires soon!',' ₹2,800/month after'],
        defaultPlan: true},
      
    ],
    defaultStorage: 1000,
    defaultPlan: 0,
    coreFeatures: ['Website', 'Portfolio','Bookings'],
    features: [ 'Unlimited Galleries','1 Million Photos','+Everything in Freelancer plan'],
    extraFeatures: { AI: 'Beta',},
  },
  {
    name: 'Company',
    pricing: [
      { storage: 5120, monthlyPrice: '₹5,150',monthlyPriceWas: '', yearlyPrice: '₹1,00,000', 
        specialOffer: ['Paid annually','Save up to ₹10,400 with annualy','2 yr commitment'],defaultPlan: true},
      
    ],
    isContactSales:true,
    defaultStorage: 5000,
    defaultPlan: 0,
    coreFeatures: [ 'Multi-studio','Custom Domain','Addon Storage'],
    features: [ 'Unlimited Bandwidth','Original File Size','+Everything in Studio plan'],
    extraFeatures: { AI: 'Beta',},
  },

  /* {
    name: 'Agency',
    pricing: [
      { storage: 5120, monthlyPrice: '₹4,000',monthlyPriceWas: '₹9,000', yearlyPrice: '₹3,00,000', specialOffer: ['for 2 months. 1 Year Contract','Save up to ₹4300 with offer',' ₹2,800/month after'],defaultPlan: true},
    ],
    defaultStorage: 1000,
    defaultPlan: 0,
    coreFeatures: [ 'Teams','Print Shop','Agency Portfolio', 'Google Calendar'],
    features: ['+ 1TB GB Cold Storage', 'Everything in Freelancer plan'],
    isContactSales: true,
    extraFeatures: { AI: 'Beta',},
  },
  {
    name: 'Print-Shop',
    pricing: [
      { storage: 5120, monthlyPrice: '₹4,000',monthlyPriceWas: '₹9,000', yearlyPrice: '₹3,00,000', specialOffer: ['for 2 months. 1 Year Contract','Save up to ₹4300 with offer',' ₹2,800/month after'],defaultPlan: true},
    ],
    defaultStorage: 1000,
    defaultPlan: 0,
    coreFeatures: [ 'Teams','Print Shop','Agency Portfolio', 'Google Calendar'],
    features: ['+ 1TB GB Cold Storage', 'Everything in Freelancer plan'],
    isContactSales: true,
    extraFeatures: { AI: 'Beta',},
  },
  {
    name: 'Premium',
    pricing: [
      { storage: 5120, monthlyPrice: '₹0',monthlyPriceWas: '₹19,000', yearlyPrice: '₹5,00,000', specialOffer: ['for 2 months. 1 Year Contract','Save up to ₹4300 with offer',' ₹2,800/month after'],defaultPlan: true},
    ],
    defaultStorage: 10000,
    defaultPlan: 0,
    coreFeatures: [ 'Flow AI','Print Shop','Agency Portfolio', 'Google Calendar'],
    features: ['+ 1TB GB Cold Storage', 'Everything in Freelancer plan'],
    isContactSales: true,
    extraFeatures: { AI: 'Beta',},
  },
  {
    name: 'Enterprise',
    pricing: [
      { storage: 10200, monthlyPrice: '',monthlyPriceWas: '', yearlyPrice: '', specialOffer: ['5 Year Contract'],defaultPlan: true},
    ],
    defaultStorage: 10000,
    defaultPlan: 0,
    coreFeatures: [ 'Flow AI','','', ''],
    features: [],
    extraFeatures: { AI: 'Beta',},
    isContactSales: true,
  }, */
];