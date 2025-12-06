export const initialPlans = [
  {
    name: 'Free',
    isCurrentPlan: true,
    pricing: [
      { storage: 15, monthlyPrice: 'Free', yearlyPrice: '–', specialOffer: []},
    ],
    features: [
      '3 Active Projects',
      '5 Collections',
      '500 Photos per Project',
      'Web only Resolution + Watermark',
      'Fotoflow watermark',
      'Community Support'
    ],
    defaultPlan:0 ,
    expiry: 'Forever',
  },
  {
    name: 'Freelancer',
    pricing: [
      { storage: 500, monthlyPrice: '₹899', yearlyPrice: '₹7,990', specialOffer: ['Save 26%','₹665/mo equivalent'], defaultPlan: true },
    ],
    defaultPlan: 0,
    defaultStorage: 500,
    features: [
      '30 Active Projects',
      'Unlimited Collections',
      'Unlimited Photos',
      'Original files Resolution',
      'Removable Watermark',
      'Email Support'
    ],
    extraFeatures: {},
  },
  {
    name: 'Studio',
    pricing: [
      { storage: 3072, 
        monthlyPrice: '₹1,799', yearlyPrice: '₹15,990', 
        specialOffer: ['Save 26%', '₹1,332/mo equivalent', 'Most studios pick this'],
        defaultPlan: true},
    ],
    defaultStorage: 3072,
    defaultPlan: 0,
    features: [
      'Unlimited Active Projects',
      'Unlimited Collections',
      'Unlimited Photos',
      'Original files Resolution',
      'Custom or none Watermark',
      'Priority + Slack/Chat Support',
      'Client proofing galleries', 
      'Team seats (up to 5)',
      'White-label'
    ],
    extraFeatures: { badge: 'Most Popular' },
  },
  {
    name: 'Enterprise',
    pricing: [
      { storage: 10240, monthlyPrice: 'Custom', yearlyPrice: 'Custom', 
        specialOffer: [],defaultPlan: true},
    ],
    isContactSales:true,
    defaultStorage: 'Unlimited',
    defaultPlan: 0,
    features: [
      'Unlimited Active Projects',
      'Unlimited Collections',
      'Unlimited Photos',
      'Original + RAW backup Resolution',
      'None Watermark',
      'Dedicated manager Support',
      'Everything + API',
      'SSO, on-premise option'
    ],
    extraFeatures: {},
  },
];
