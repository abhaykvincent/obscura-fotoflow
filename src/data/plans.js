export const initialPlans = [
  {
    name: 'Free',
    isCurrentPlan: true,
    pricing: [
      { storage: 15, monthlyPrice: 'Free', yearlyPrice: '–', specialOffer: ['Forever']},
    ],
    features: [
      'Gallery',
      'Selection',
      '3 Projects / month',

      '3 Collections / project',
      '500 Photos / gallery',
      'Whatsapp Support'
    ],
    defaultPlan:0 ,
    expiry: 'Forever',
  },
  {
    name: 'Freelancer',
    pricing: [
      { storage: 100, monthlyPrice: '₹899', yearlyPrice: '₹7,990', specialOffer: ['for 3 months','₹999 afterwards'], defaultPlan: true },
    ],
    defaultPlan: 0,
    defaultStorage: 100,
    features: [
      'Unlimited Gallery',
      'Unlimited Selection',
      '30 Projects/ month',
      'High Resolution',
      'Financials',
      'Archive',
      'Client proofing galleries',
      'Chat Support +  Whatsapp'
    ],
    extraFeatures: {},
  },
  {
    name: 'Studio',
    pricing: [
      { storage: 1024, 
        monthlyPriceWas: '₹2400', monthlyPrice: '₹1,799', yearlyPrice: '₹15,990', 
        specialOffer: ['6x Value for money', 'Most wedding studios pick this'],
        defaultPlan: true},
    ],
    defaultStorage: 1024,
    defaultPlan: 0,
    features: [
      'Website',
      'Unlimited ',
      'Desktop Studio App ',
      'Custom gallery access',
      'Wedding/Event Invitation',
      'Priority + Whatsapp + Chat Support ',
      'Original files Resolution',
      'Client proofing galleries', 
      'Team seats (up to 12)',
      'White-label'
    ],
    extraFeatures: { badge: 'Most Popular' },
  },
  {
    name: 'Enterprise',
    pricing: [
      { storage: 10240, monthlyPrice: '₹5,000+ ', yearlyPrice: '₹51,110 +', specialOffer: ['For Wedding Companies and Agencies ']
       ,defaultPlan: true},
    ],
    isContactSales:true,
    defaultStorage: 'Unlimited',
    defaultPlan: 0,
    features: [
      'AI Face search',
      'Advanced AI Workflow',
      'Original + RAW backup Resolution',
    ],
    extraFeatures: {},
  },
];
