import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGalleryStudio, selectGalleryStudio, selectGalleryStudioLoading } from '../../app/slices/studioSlice';
import { fetchPackages, selectPackages, selectPackagesLoading } from '../../app/slices/packagesSlice';
import { createBooking, selectBookingLoading, selectBookingError } from '../../app/slices/bookingSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { LoadingLight } from '../../components/Loading/Loading';
import './Booking.scss';

// Time slot definitions
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM'
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
  const [currentStep, setCurrentStep] = useState(1); // 1: Package, 2: Schedule, 3: Details, 4: Success
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  
  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
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

  // Handle fallback if studio has no packages
  const activePackages = packages && packages.length > 0 ? packages : [
    {
      id: 'default-studio-session',
      name: 'Standard Studio Session',
      description: 'A professional photo session in our fully equipped studio.',
      tiers: [
        {
          name: 'Standard',
          price: '150',
          services: ['1 Hour Shoot', '10 Edited Photos', 'Online Gallery Access', '1 Outfit Change']
        },
        {
          name: 'Premium',
          price: '299',
          services: ['2 Hour Shoot', '25 Edited Photos', 'Online Gallery Access', '3 Outfit Changes', 'High Res Downloads']
        }
      ]
    }
  ];

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    // Auto select first tier if available
    if (pkg.tiers && pkg.tiers.length > 0) {
      setSelectedTier(pkg.tiers[0]);
    } else {
      setSelectedTier({ name: 'Standard', price: 'TBD', services: [] });
    }
    setCurrentStep(2);
  };

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
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
      dispatch(showAlert({ type: 'success', message: 'Session booked successfully!' }));
    } catch (err) {
      dispatch(showAlert({ type: 'error', message: err || 'Failed to book session.' }));
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
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    );
  };

  if (studioLoading) {
    return (
      <div className="booking-loading-screen">
        <LoadingLight />
        <p>Loading studio details...</p>
      </div>
    );
  }

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
            <p className="studio-tagline">{studio?.settings?.gallery?.galleryTagline || 'Welcome to our studio booking portal'}</p>
          </div>
        </div>
      </header>

      <main className="booking-flow-container">
        {/* Progress Bar */}
        {currentStep < 4 && (
          <div className="booking-steps-nav">
            <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <span className="step-num">1</span>
              <span className="step-label">Select Service</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <span className="step-num">2</span>
              <span className="step-label">Schedule Time</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-num">3</span>
              <span className="step-label">Your Details</span>
            </div>
          </div>
        )}

        {/* Step 1: Package Selection */}
        {currentStep === 1 && (
          <section className="booking-step-section fade-in">
            <h2>Select a package to get started</h2>
            {packagesLoading ? (
              <LoadingLight />
            ) : (
              <div className="packages-grid">
                {activePackages.map((pkg) => (
                  <div key={pkg.id} className="package-card-premium">
                    <div className="card-glass-glow"></div>
                    <div className="card-content">
                      <h3>{pkg.name}</h3>
                      <p className="pkg-description">{pkg.description || 'Custom photography package tailored to your needs.'}</p>
                      
                      {pkg.tiers && pkg.tiers.length > 0 && (
                        <div className="pkg-price-range">
                          Starting at <span>${pkg.tiers[0].price}</span>
                        </div>
                      )}

                      <button 
                        type="button" 
                        className="button primary select-pkg-btn"
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        Book This Package
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 2: Schedule (Calendar & Slots) */}
        {currentStep === 2 && selectedPackage && (
          <section className="booking-step-section booking-schedule-section fade-in">
            <div className="back-link-btn" onClick={() => setCurrentStep(1)}>&larr; Back to packages</div>
            <h2>Configure & Schedule: {selectedPackage.name}</h2>
            
            {/* Tiers Selector if package has multiple tiers */}
            {selectedPackage.tiers && selectedPackage.tiers.length > 0 && (
              <div className="tiers-selection-wrapper">
                <h3>Select a Tier</h3>
                <div className="tiers-grid">
                  {selectedPackage.tiers.map((tier, idx) => (
                    <div 
                      key={`${tier.name}-${idx}`} 
                      className={`tier-option-card ${selectedTier?.name === tier.name ? 'active' : ''}`}
                      onClick={() => handleTierSelect(tier)}
                    >
                      <div className="tier-header">
                        <h4>{tier.name}</h4>
                        <span className="tier-price">${tier.price}</span>
                      </div>
                      <ul className="tier-features">
                        {tier.services?.map((service, sIdx) => (
                          <li key={sIdx}>{service}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="schedule-picker-grid">
              <div className="picker-col">
                <h3>Select Date</h3>
                {renderCalendar()}
              </div>
              <div className="picker-col">
                <h3>Select Time Slot</h3>
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
                    <p>Please select a date from the calendar first to view available time slots.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="step-actions">
              <button 
                type="button" 
                className="button primary"
                disabled={!selectedDate || !selectedTimeSlot}
                onClick={() => setCurrentStep(3)}
              >
                Continue to Details &rarr;
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Client Details Form */}
        {currentStep === 3 && selectedPackage && selectedDate && selectedTimeSlot && (
          <section className="booking-step-section fade-in">
            <div className="back-link-btn" onClick={() => setCurrentStep(2)}>&larr; Back to schedule</div>
            <h2>Confirm details and complete booking</h2>

            <div className="booking-summary-card">
              <h3>Booking Summary</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span className="label">Package:</span>
                  <span className="value">{selectedPackage.name}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Pricing Tier:</span>
                  <span className="value">{selectedTier?.name} (${selectedTier?.price})</span>
                </div>
                <div className="summary-row">
                  <span className="label">Scheduled Date:</span>
                  <span className="value">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Time Slot:</span>
                  <span className="value">{selectedTimeSlot}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="booking-details-form">
              <div className="form-group">
                <label htmlFor="client-name">Full Name *</label>
                <input
                  type="text"
                  id="client-name"
                  name="name"
                  required
                  value={clientInfo.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
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
                    value={clientInfo.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="client-phone"
                    name="phone"
                    required
                    value={clientInfo.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="client-notes">Additional Notes or Requests</label>
                <textarea
                  id="client-notes"
                  name="notes"
                  value={clientInfo.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Any details about outfits, locations, themes, etc."
                />
              </div>

              {bookingError && <div className="form-error-msg">{bookingError}</div>}

              <button 
                type="submit" 
                className="button primary submit-booking-btn"
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Processing Booking...' : `Book Session for $${selectedTier?.price}`}
              </button>
            </form>
          </section>
        )}

        {/* Step 4: Success Screen */}
        {currentStep === 4 && (
          <section className="booking-success-section fade-in">
            <div className="success-icon-wrap">
              <span className="success-checkmark">&#10004;</span>
            </div>
            <h2>Booking Confirmed!</h2>
            <p className="success-msg">Your appointment request has been submitted to the studio. A confirmation email with details will be sent to you shortly.</p>

            <div className="success-summary-card">
              <h3>Session Overview</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span className="label">Studio:</span>
                  <span className="value">{studio?.name || studioName}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Package / Tier:</span>
                  <span className="value">{selectedPackage?.name} / {selectedTier?.name}</span>
                </div>
                <div className="summary-row">
                  <span className="value">
                    {selectedDate?.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTimeSlot}
                  </span>
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
                setSelectedDate(null);
                setSelectedTimeSlot('');
                setClientInfo({ name: '', email: '', phone: '', notes: '' });
              }}
            >
              Book Another Session
            </button>
          </section>
        )}
      </main>

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
