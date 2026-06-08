import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGalleryStudio, selectGalleryStudio, selectGalleryStudioLoading } from '../../app/slices/studioSlice';
import { fetchPackages, selectPackages, selectPackagesLoading } from '../../app/slices/packagesSlice';
import { createBooking, selectBookingLoading, selectBookingError } from '../../app/slices/bookingSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { LoadingLight } from '../../components/Loading/Loading';
import './Booking.scss';

// Time slot definitions tailored for Indian wedding events and shoot timelines
const TIME_SLOTS = [
  '06:00 AM (Sunrise / Muhurtham)', 
  '09:00 AM (Morning Session)', 
  '11:00 AM (Late Morning)', 
  '02:00 PM (Afternoon Session)', 
  '04:00 PM (Sunset / Outdoor)', 
  '06:00 PM (Evening Reception)'
];

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
  const activePackages = packages && packages.length > 0 ? packages : [
    {
      id: 'pre-wedding-cinematic',
      name: 'Pre-Wedding & Engagement Session',
      description: 'Capture your love story at scenic outdoor locations. Complete with cinematic clips and custom-tailored theme assistance.',
      tiers: [
        {
          name: 'Standard Package',
          price: '25,000',
          services: ['4 Hours Outdoor Shoot', '25 Retouched Photos', 'Cinematic Instagram Reel (1 min)', 'All RAW Images Delivered']
        },
        {
          name: 'Elite Cinematic',
          price: '45,000',
          services: ['Full Day Outdoor Shoot', '50 Retouched Photos', 'Cinematic Teaser (2-3 mins)', 'Drone / Aerial Footage', 'Outfit Changes (Up to 3)']
        }
      ]
    },
    {
      id: 'wedding-coverage-luxury',
      name: 'Wedding & Traditional Event Coverage',
      description: 'Comprehensive wedding coverage featuring premium candid shoots, traditional coverage, and cinematic highlights.',
      tiers: [
        {
          name: 'One-Day Traditional',
          price: '40,000',
          services: ['Candid + Traditional Photographer', 'Full Event Coverage (8 hours)', '300+ Digital Images', 'RAW File Share']
        },
        {
          name: 'Signature Layflat Package',
          price: '85,000',
          services: ['2 Candid Photographers', '1 Traditional Videographer', 'Premium Layflat Photobook (40 Pages)', 'Cinematic Highlight Film (4 mins)']
        },
        {
          name: 'Luxury Royal Package',
          price: '1,50,000',
          services: ['Complete Photo + Video Team', '2 Premium Hardcover Albums', 'Full Wedding Film (30 mins)', 'Teaser Reel', 'Live Web Streaming Link']
        }
      ]
    },
    {
      id: 'maternity-baby-shoot',
      name: 'Maternity & Newborn Session',
      description: 'Cherish your precious milestones with beautiful, creative portrait setups in our temperature-controlled studio or outdoors.',
      tiers: [
        {
          name: 'Mini Session',
          price: '12,000',
          services: ['2 Hours Studio Shoot', '12 Retouched Photos', 'Props Provided by Studio', '1 Outfit Change']
        },
        {
          name: 'Signature Bump-to-Baby',
          price: '22,000',
          services: ['Maternity + Newborn (2 separate sessions)', '30 Retouched Photos', 'Custom Theme Setup', 'Family Portraits Included']
        }
      ]
    }
  ];

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
          <section className="booking-step-section fade-in">
            {packagesLoading ? (
              <LoadingLight />
            ) : (
              <div className="packages-premium-list">
                {activePackages.map((pkg) => (
                  <div key={pkg.id} className="package-card-detailed">
                    <div className="pkg-info-col">
                      <h3>{pkg.name}</h3>
                      <p className="pkg-desc">{pkg.description || 'Professional photo and video coverage.'}</p>
                    </div>

                    <div className="pkg-tiers-col">
                      {pkg.tiers && pkg.tiers.length > 0 ? (
                        pkg.tiers.map((tier, idx) => (
                          <div key={`${tier.name}-${idx}`} className="tier-strip-card">
                            <div className="tier-meta">
                              <span className="tier-name">{tier.name}</span>
                              <span className="tier-price">{getDisplayPrice(tier.price)}</span>
                            </div>
                            <ul className="tier-services-list">
                              {tier.services?.slice(0, 3).map((svc, sIdx) => (
                                <li key={sIdx}>{svc}</li>
                              ))}
                              {tier.services?.length > 3 && (
                                <li className="more-services">+{tier.services.length - 3} more deliverables</li>
                              )}
                            </ul>
                            <button
                              type="button"
                              className="button primary select-tier-btn"
                              onClick={() => handlePackageAndTierSelect(pkg, tier)}
                            >
                              Book {tier.name}
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="tier-strip-card">
                          <div className="tier-meta">
                            <span className="tier-name">Standard</span>
                            <span className="tier-price">₹ On Inquiry</span>
                          </div>
                          <button
                            type="button"
                            className="button primary select-tier-btn"
                            onClick={() => handlePackageAndTierSelect(pkg, { name: 'Standard', price: 'On Request' })}
                          >
                            Inquire Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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
