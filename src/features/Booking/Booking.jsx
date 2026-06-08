import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGalleryStudio, selectGalleryStudio, selectGalleryStudioLoading } from '../../app/slices/studioSlice';
import { fetchPackages, selectPackages, selectPackagesLoading } from '../../app/slices/packagesSlice';
import { createBooking, selectBookingLoading, selectBookingError } from '../../app/slices/bookingSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { LoadingLight } from '../../components/Loading/Loading';
import './Booking.scss';

// Image assets for packages
import thaliTyingImg from '../../assets/img/booking/kerala_thali_tying.png';
import weddingCandidImg from '../../assets/img/booking/kerala_wedding_candid.png';
import templePortraitImg from '../../assets/img/booking/kerala_temple_portrait.png';

// Time slot definitions tailored for Indian wedding events and shoot timelines
const TIME_SLOTS = ['Morning','Noon','Evening'];

// Helper function to extract inclusions and exclusions for each tier
const getTierServicesWithExclusions = (tiers, currentTier) => {
  if (currentTier.missing) {
    return {
      inclusions: currentTier.services || [],
      exclusions: currentTier.missing
    };
  }

  // Fallback: dynamically compute exclusions by comparing with other tiers' services
  const allServices = Array.from(
    new Set(tiers.flatMap(t => t.services || []))
  );
  
  const inclusions = currentTier.services || [];
  const exclusions = allServices.filter(s => !inclusions.includes(s));

  return {
    inclusions,
    exclusions
  };
};

// Static pricing tiers and package information templates by event type
const PACKAGE_TEMPLATES = {
  wedding: {
    description: 'Elevated multi-day & single-day wedding films and candid photography, custom-tailored for traditional Kerala ceremonies.',
    tiers: [
      {
        name: 'The Intimate / Single-Day',
        price: '50,000',
        target: 'Small engagement functions, temple weddings, or budget-conscious couples.',
        thumbnail: thaliTyingImg,
        services: [
          '1 Lead Photographer',
          '1 Traditional Videographer',
          '1 Day event coverage',
          'Online Digital Gallery delivery'
        ],
        missing: [
          'Drone / Aerial coverage',
          'Same-day Edit Video',
          'Premium Layflat Album',
          'Live Web Streaming'
        ],
        cta: 'Check Availability'
      },
      {
        name: 'The Signature / Multi-Day',
        price: '1,20,000',
        popular: true,
        target: 'The standard 2-to-3-day Kerala wedding (Save the Date/Haldi/Mehendi + Wedding + Reception).',
        thumbnail: weddingCandidImg,
        services: [
          '2 Photographers (Candid + Traditional)',
          '2 Videographers (Cinematic + 4K Conventional)',
          'Drone / Aerial coverage',
          'Premium Magazine-style Album',
          'Online Digital Gallery delivery'
        ],
        missing: [
          'Same-day Edit Video',
          'Live Web Streaming',
          'Pre/Post-wedding shoot'
        ],
        cta: 'Book a Consultation'
      },
      {
        name: 'The Royal / Luxury Heritage',
        price: '2,50,000',
        target: 'High-budget, grand NRI or destination weddings (e.g., Kumarakom resorts or Bolgatty).',
        thumbnail: templePortraitImg,
        services: [
          'Full Photo & Video Crew (Candid & Conventional)',
          'Same-day Edit Wedding Highlights video',
          'Live YouTube Streaming (highly requested by NRI families)',
          'Pre/Post-wedding outdoor shoots',
          'Multiple Premium Albums (2 Hardcover + Parent Albums)',
          'Online Digital Gallery delivery',
          'Drone / Aerial coverage'
        ],
        missing: [],
        cta: 'Request Custom Proposal'
      }
    ]
  },
  maternity: {
    description: 'Cherish your precious milestones with beautiful, creative portrait setups in our temperature-controlled studio or outdoors.',
    tiers: [
      {
        name: 'Mini Session',
        price: '12,000',
        target: 'Quick, intimate session with essential props.',
        services: ['2 Hours Studio Shoot', '12 Retouched Photos', 'Props Provided by Studio', '1 Outfit Change'],
        missing: ['Family Portraits Included', 'Newborn session (separate)', 'Custom Theme Setup'],
        cta: 'Check Availability'
      },
      {
        name: 'Signature Bump-to-Baby',
        price: '22,000',
        target: 'Comprehensive package capturing both pregnancy and the baby\'s first days.',
        services: ['Maternity + Newborn (2 separate sessions)', '30 Retouched Photos', 'Custom Theme Setup', 'Family Portraits Included'],
        missing: [],
        cta: 'Book a Consultation'
      }
    ]
  },
  newborn: {
    description: 'Sweet, sleepy poses and tiny details of your newborn captured in a safe, warm, and hygienic studio environment.',
    tiers: [
      {
        name: 'Newborn Mini',
        price: '15,000',
        target: 'Focus on baby-only portraits with simple, elegant wraps and props.',
        services: ['2 Hours Studio Session', '10 Retouched Photos', 'Props & Swaddles Provided', 'Safe, Temperature-Controlled Setup'],
        missing: ['Parent & Sibling Portraits', 'Custom Set Themes', 'Premium Album'],
        cta: 'Check Availability'
      },
      {
        name: 'Newborn & Family',
        price: '28,000',
        target: 'Includes family portraits, multiple outfit changes, and custom themed setups.',
        services: ['4 Hours Session', '25 Retouched Photos', 'Parent & Sibling Portraits Included', '3 Custom Theme Setups', 'Premium Layflat Album (15 Pages)'],
        missing: [],
        cta: 'Book a Consultation'
      }
    ]
  },
  baptism: {
    description: "Capture your child's sacred baptism or holy communion ceremony with elegant photography and cinematic family highlights.",
    tiers: [
      {
        name: 'Ceremony Only',
        price: '15,000',
        target: 'Essential coverage for the church service and family portraits.',
        services: ['2 Hours Coverage', '20 Retouched Photos', 'Online Digital Gallery delivery', 'All RAW Images Delivered'],
        missing: ['Reception / After-party Coverage', 'Physical Photo Album', 'Highlight Video'],
        cta: 'Check Availability'
      },
      {
        name: 'Ceremony & Reception',
        price: '30,000',
        target: 'Complete coverage of the church ceremony and reception celebrations.',
        services: ['5 Hours Coverage', '45 Retouched Photos', '3-Minute Cinematic Highlight Video', 'Premium Layflat Album (20 Pages)', 'Online Digital Gallery delivery'],
        missing: [],
        cta: 'Book a Consultation'
      }
    ]
  },
  birthday: {
    description: 'Celebrate your child\'s special day or family milestones with vibrant event photography and birthday highlights.',
    tiers: [
      {
        name: 'Standard Celebration',
        price: '10,000',
        target: 'Perfect for intimate family birthday parties at home or small halls.',
        services: ['3 Hours Event Coverage', '25 Retouched Photos', 'Candid & Traditional Mix', 'Online Digital Gallery delivery'],
        missing: ['Cinematic Highlights Video', 'Photobooth Setup', 'Custom Album'],
        cta: 'Check Availability'
      },
      {
        name: 'Grand Birthday Blast',
        price: '20,000',
        target: 'Comprehensive coverage for larger parties with custom theme shoots.',
        services: ['5 Hours Coverage', '50 Retouched Photos', 'Cinematic Highlight Reel (1-2 mins)', 'Premium Photo Album', 'Online Digital Gallery delivery'],
        missing: [],
        cta: 'Book a Consultation'
      }
    ]
  },
  anniversaries: {
    description: 'Commemorate love stories and milestones with timeless couple portraits and anniversary event coverage.',
    tiers: [
      {
        name: 'Intimate Anniversary',
        price: '12,000',
        target: 'A brief couple portrait session at a scenic location or in-studio.',
        services: ['2 Hours Shoot', '15 Retouched Photos', 'Online Digital Gallery delivery', 'All RAW Images Delivered'],
        missing: ['Full Event Coverage', 'Cinematic Highlights Video', 'Premium Album'],
        cta: 'Check Availability'
      },
      {
        name: 'Jubilee Celebration',
        price: '25,000',
        target: 'Full coverage of the anniversary event and family gatherings.',
        services: ['5 Hours Event Coverage', '40 Retouched Photos', '3-Minute Cinematic Couple Film', 'Premium Magazine-style Album', 'Online Digital Gallery delivery'],
        missing: [],
        cta: 'Book a Consultation'
      }
    ]
  },
  default: {
    description: 'Professional photography services customized for your special milestones and events.',
    tiers: [
      {
        name: 'Standard Coverage',
        price: '15,000',
        target: 'Essential coverage for your custom event or photoshoot.',
        services: ['3 Hours Coverage', '20 Retouched Photos', 'Online Digital Gallery delivery', 'All RAW Images Delivered'],
        missing: [],
        cta: 'Check Availability'
      }
    ]
  }
};

// Resolves package tiers and description based on the package name
const resolvePackageTemplate = (name) => {
  const normalized = (name || '').toLowerCase();
  const key = Object.keys(PACKAGE_TEMPLATES).find(k => normalized.includes(k));
  return PACKAGE_TEMPLATES[key] || PACKAGE_TEMPLATES.default;
};

export default function Booking() {
  const { studioName } = useParams();
  const dispatch = useDispatch();

  // Redux Selectors
  const studio = useSelector(selectGalleryStudio);
  const studioLoading = useSelector(selectGalleryStudioLoading);
  const packages = useSelector(selectPackages);
  const packagesLoading = useSelector(selectPackagesLoading);
  const bookingLoading = useSelector(selectBookingLoading);
  const bookingError = useSelector(selectBookingError);

  // Component States
  const [currentStep, setCurrentStep] = useState(1); // 1: Package & Tier, 2: Schedule, 3: Details, 4: Success
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [activePackageId, setActivePackageId] = useState('');
  
  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    // Pre-select tomorrow's date for a faster flow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Form states
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Load Studio & Packages
  useEffect(() => {
    if (studioName) {
      document.title = `${studioName} | Studio Booking`;
      dispatch(fetchGalleryStudio({ currentDomain: studioName }));
      dispatch(fetchPackages(studioName));
    }
  }, [studioName, dispatch]);

  // Handle fallback if studio has no packages - configured with Indian market rates and packages
  const fallbackPackages = [
    { id: 'wedding-coverage-luxury', name: 'Wedding' },
    { id: 'baptism-ceremony', name: 'Baptism' },
    { id: 'maternity-shoot', name: 'Maternity' },
    { id: 'newborn-shoot', name: 'Newborn' },
    { id: 'birthday-shoot', name: 'Birthday' },
    { id: 'anniversary-shoot', name: 'Anniversaries' }
  ];

  const activePackages = (packages && packages.length > 0 ? packages : fallbackPackages).map(pkg => {
    const template = resolvePackageTemplate(pkg.name);
    return {
      ...pkg,
      description: pkg.description || template.description,
      tiers: pkg.tiers && pkg.tiers.length > 0 ? pkg.tiers : template.tiers
    };
  });

  // Set default selected package when activePackages loads
  useEffect(() => {
    if (activePackages && activePackages.length > 0 && !activePackageId) {
      const weddingPkg = activePackages.find(p => p.id.includes('wedding') || p.name.toLowerCase().includes('wedding'));
      setActivePackageId(weddingPkg ? weddingPkg.id : activePackages[0].id);
    }
  }, [activePackages, activePackageId]);

  const handlePackageAndTierSelect = (pkg, tier) => {
    setSelectedPackage(pkg);
    setSelectedTier(tier);
    setCurrentStep(2);
  };

  // Calendar Helpers
  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate >= today) {
      setSelectedDate(clickedDate);
      setSelectedTimeSlot(''); // Reset timeslot on date change
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
      dispatch(showAlert({ type: 'error', message: 'Please fill in all required fields.' }));
      return;
    }

    const bookingData = {
      packageName: selectedPackage.name,
      packageId: selectedPackage.id,
      tierName: selectedTier.name,
      price: selectedTier.price,
      date: selectedDate.toISOString().split('T')[0],
      timeSlot: selectedTimeSlot,
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      clientPhone: clientInfo.phone,
      clientNotes: clientInfo.notes,
      status: 'pending'
    };

    try {
      await dispatch(createBooking({ domain: studioName, bookingData })).unwrap();
      setCurrentStep(4);
      dispatch(showAlert({ type: 'success', message: 'Booking request sent successfully!' }));
    } catch (err) {
      dispatch(showAlert({ type: 'error', message: err || 'Failed to submit booking request.' }));
    }
  };

  // Render Functions
  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);

    const days = [];

    // Empty spots for previous month padding
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isPast = currentDate < today;
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth.getMonth() && 
        selectedDate.getFullYear() === currentMonth.getFullYear();

      days.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => handleDateClick(day)}
          className={`calendar-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button type="button" className="nav-btn prev" onClick={handlePrevMonth}>&larr;</button>
          <h3>
            {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
          </h3>
          <button type="button" className="nav-btn next" onClick={handleNextMonth}>&rarr;</button>
        </div>
        <div className="calendar-weekdays">
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    );
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Select a Service & Pricing Tier';
      case 2:
        return 'Select Date & Time Slot';
      case 3:
        return 'Submit Booking Request';
      default:
        return 'Request Received';
    }
  };

  if (studioLoading) {
    return (
      <div className="booking-loading-screen">
        <LoadingLight />
        <p>Loading studio details...</p>
      </div>
    );
  }

  // Check currency formatting - uses Rupee symbol for Indian studio context
  const getDisplayPrice = (price) => {
    if (price.includes('₹') || price.includes('$')) {
      return price;
    }
    return `₹${price}`;
  };

  return (
    <div className="booking-page-wrapper">
      <header className="booking-studio-header">
        <div className="studio-brand-wrap">
          {studio?.studioLogo ? (
            <img src={studio.studioLogo} alt={studio.name} className="studio-logo" />
          ) : (
            <div className="studio-logo-fallback">
              {studio?.name ? studio.name.charAt(0).toUpperCase() : studioName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="brand-text">
            <h1>{studio?.name || toTitleCase(studioName)}</h1>
            <p className="studio-tagline">{studio?.settings?.gallery?.galleryTagline || 'Professional Photography & Cinematic Films'}</p>
          </div>
        </div>
      </header>

      <div className="booking-flow-container">
        {/* Progress Bar & Steppers */}
        {currentStep < 4 && (
          <div className="booking-progress-header">
            <div className="progress-text-wrap">
              <span className="step-indicator">Step {currentStep} of 3</span>
              <h2>{getStepTitle()}</h2>
            </div>
            
            {/* Mobile progress fill */}
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
            </div>

            {/* Desktop step icons */}
            <div className="booking-steps-nav">
              <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <span className="step-num">1</span>
                <span className="step-label">Select Package</span>
              </div>
              <div className="step-line"></div>
              <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <span className="step-num">2</span>
                <span className="step-label">Schedule Date & Time</span>
              </div>
              <div className="step-line"></div>
              <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span className="step-label">Submit Details</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Package & Tier Grid */}
        {currentStep === 1 && (
          <div className="booking-step-section-wrapper fade-in">
            {packagesLoading ? (
              <div className="booking-step-section">
                <LoadingLight />
              </div>
            ) : (
              <>
                {/* Category Tab Buttons for packages */}
                <div className="booking-package-tabs">
                  {activePackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      className={`package-tab-btn ${activePackageId === pkg.id ? 'active' : ''}`}
                      onClick={() => setActivePackageId(pkg.id)}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>

                {/* Main Package Section */}
                {(() => {
                  const currentPackage = activePackages.find(p => p.id === activePackageId) || activePackages[0];
                  if (!currentPackage) return null;

                  return (
                    <div className="package-details-wrapper">
                      <div className="package-intro-header">
                        <h3>{currentPackage.name}</h3>
                        <p>{currentPackage.description}</p>
                      </div>

                      <div className="package-tiers-grid">
                        {currentPackage.tiers && currentPackage.tiers.length > 0 ? (
                          currentPackage.tiers.map((tier, idx) => {
                            const isPopular = tier.popular || (currentPackage.id === 'wedding-coverage-luxury' && idx === 1);
                            const { inclusions, exclusions } = getTierServicesWithExclusions(currentPackage.tiers, tier);

                            return (
                              <div key={`${tier.name}-${idx}`} className={`tier-card ${isPopular ? 'popular-tier' : ''}`}>
                                {isPopular && (
                                  <div className="popular-badge">Most Popular</div>
                                )}
                                
                                {tier.thumbnail && (
                                  <div className="tier-thumbnail-wrap">
                                    <img src={tier.thumbnail} alt={tier.name} className="tier-thumbnail" />
                                    <div className="tier-thumbnail-overlay"></div>
                                  </div>
                                )}

                                <div className="tier-card-header">
                                  <h4 className="tier-card-name">{tier.name}</h4>
                                  {tier.target && <p className="tier-card-target">{tier.target}</p>}
                                  <div className="tier-card-price-wrap">
                                    <span className="price-currency">₹</span>
                                    <span className="price-value">{tier.price}</span>
                                    <span className="price-period">est.</span>
                                  </div>
                                </div>

                                <div className="tier-card-body">
                                  <ul className="tier-features-list">
                                    {/* Render inclusions */}
                                    {inclusions.map((svc, sIdx) => (
                                      <li key={`inc-${sIdx}`} className="feature-item inclusion">
                                        <span className="feature-icon check-icon">✓</span>
                                        <span className="feature-text">{svc}</span>
                                      </li>
                                    ))}
                                    
                                    {/* Render exclusions */}
                                    {exclusions.map((missingSvc, mIdx) => (
                                      <li key={`miss-${mIdx}`} className="feature-item exclusion">
                                        <span className="feature-icon cross-icon">✗</span>
                                        <span className="feature-text">{missingSvc}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="tier-card-footer">
                                  <button
                                    type="button"
                                    className={`button select-tier-btn ${isPopular ? 'primary' : 'secondary'}`}
                                    onClick={() => handlePackageAndTierSelect(currentPackage, tier)}
                                  >
                                    {tier.cta || `Book ${tier.name}`}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="tier-card">
                            <div className="tier-card-header">
                              <h4 className="tier-card-name">Standard Coverage</h4>
                              <div className="tier-card-price-wrap">
                                <span className="price-currency">₹</span>
                                <span className="price-value">On Request</span>
                              </div>
                            </div>
                            <div className="tier-card-footer">
                              <button
                                type="button"
                                className="button primary select-tier-btn"
                                onClick={() => handlePackageAndTierSelect(currentPackage, { name: 'Standard', price: 'On Request' })}
                              >
                                Inquire Now
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* Step 2: Date & Time Picker */}
        {currentStep === 2 && selectedPackage && selectedTier && (
          <section className="booking-step-section booking-schedule-section fade-in">
            <div className="back-link-btn" onClick={() => setCurrentStep(1)}>&larr; Back to packages</div>
            
            <div className="selected-item-pill">
              Selected: <strong>{selectedPackage.name} ({selectedTier.name} - {getDisplayPrice(selectedTier.price)})</strong>
            </div>

            <div className="schedule-picker-grid">
              <div className="picker-col">
                <div className="col-header-wrap">
                  <span className="col-num">1</span>
                  <h3>Select Date</h3>
                </div>
                {renderCalendar()}
              </div>

              <div className="picker-col">
                <div className="col-header-wrap">
                  <span className="col-num">2</span>
                  <h3>Select Time Slot</h3>
                </div>
                {selectedDate ? (
                  <div className="time-slots-grid">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot-btn ${selectedTimeSlot === slot ? 'active' : ''}`}
                        onClick={() => setSelectedTimeSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="slot-placeholder">
                    <p>Please select a date from the calendar to view available slots.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="step-actions">
              <button 
                type="button" 
                className="button primary next-step-btn"
                disabled={!selectedDate || !selectedTimeSlot}
                onClick={() => setCurrentStep(3)}
              >
                Continue to Details &rarr;
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Details & Confirmation Form */}
        {currentStep === 3 && selectedPackage && selectedTier && selectedDate && selectedTimeSlot && (
          <section className="booking-step-section fade-in">
            <div className="back-link-btn" onClick={() => setCurrentStep(2)}>&larr; Back to schedule</div>

            <div className="details-layout-grid">
              {/* Form Input fields */}
              <div className="form-column">
                <form onSubmit={handleFormSubmit} className="booking-details-form">
                  <div className="form-group">
                    <label htmlFor="client-name">Your Full Name *</label>
                    <input
                      type="text"
                      id="client-name"
                      name="name"
                      required
                      autoComplete="name"
                      value={clientInfo.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Amit Sharma"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="client-email">Email Address *</label>
                      <input
                        type="email"
                        id="client-email"
                        name="email"
                        required
                        autoComplete="email"
                        value={clientInfo.email}
                        onChange={handleInputChange}
                        placeholder="amit@gmail.com"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="client-phone">Phone / WhatsApp Number *</label>
                      <input
                        type="tel"
                        id="client-phone"
                        name="phone"
                        required
                        autoComplete="tel"
                        value={clientInfo.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="client-notes">Specify Event Details & Requirements</label>
                    <textarea
                      id="client-notes"
                      name="notes"
                      value={clientInfo.notes}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Mention event location, dress codes, theme preferences, family count, etc."
                    />
                  </div>

                  {bookingError && <div className="form-error-msg">{bookingError}</div>}

                  <button 
                    type="submit" 
                    className="button primary submit-booking-btn"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Submitting Request...' : `Submit Booking Request • ${getDisplayPrice(selectedTier.price)}`}
                  </button>
                  
                  <p className="indian-advance-note">
                    * Booking confirmation is subject to slot availability. A 30% advance is required to finalize dates during peak wedding seasons.
                  </p>
                </form>
              </div>

              {/* Sidebar Summary Card */}
              <div className="summary-column">
                <div className="booking-summary-card">
                  <h3>Booking Summary</h3>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span className="label">Event Category</span>
                      <span className="value">{selectedPackage.name}</span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Selected Tier</span>
                      <span className="value">{selectedTier.name}</span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Date</span>
                      <span className="value">
                        {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="label">Time Slot</span>
                      <span className="value">{selectedTimeSlot.split(' ')[0]} {selectedTimeSlot.includes('(') ? selectedTimeSlot.slice(selectedTimeSlot.indexOf('(')) : ''}</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row total-row">
                      <span className="label">Estimated Price</span>
                      <span className="value">{getDisplayPrice(selectedTier.price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 4: Success Screen */}
        {currentStep === 4 && (
          <section className="booking-success-section fade-in">
            <div className="success-icon-wrap">
              <span className="success-checkmark">&#10004;</span>
            </div>
            <h2>Booking Request Sent!</h2>
            <p className="success-msg">Your photo session request has been submitted to the studio. We will verify slot availability and email or call you on your WhatsApp number shortly.</p>

            <div className="success-summary-card">
              <h3>Session Overview</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span className="label">Studio</span>
                  <span className="value">{studio?.name || studioName}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Package / Tier</span>
                  <span className="value">{selectedPackage?.name} ({selectedTier?.name})</span>
                </div>
                <div className="summary-row">
                  <span className="label">Appointment Time</span>
                  <span className="value">
                    {selectedDate?.toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTimeSlot}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="label">Estimated Price</span>
                  <span className="value">{selectedTier ? getDisplayPrice(selectedTier.price) : ''}</span>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="button secondary"
              onClick={() => {
                // Reset states
                setCurrentStep(1);
                setSelectedPackage(null);
                setSelectedTier(null);
                setSelectedDate(new Date());
                setSelectedTimeSlot('');
                setClientInfo({ name: '', email: '', phone: '', notes: '' });
              }}
            >
              Book Another Session
            </button>
          </section>
        )}
      </div>

      <footer className="booking-footer">
        Powered by <a href="https://fotoflow.pro" target="_blank" rel="noopener noreferrer">FotoFlow Pro</a>
      </footer>
    </div>
  );
}

// Helper utility to convert kebab case to Title Case
function toTitleCase(str) {
  if (!str) return '';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
