import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';
import { selectSelectionRequests } from '../../../app/slices/selectionRequestSlice';
import { formatDateStyle02 } from '../../../utils/dateUtils';
import './StatusPipeline.scss';

const STAGES = ['Booking', 'Crew', 'Shoot', 'Upload', 'Selection', 'Design', 'Delivery'];

// Timezone-safe helper functions for date comparisons
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

const isPast = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(d);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

const isWithin48Hours = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = Date.now();
  const diffTime = d.getTime() - now;
  return diffTime > 0 && diffTime <= 48 * 60 * 60 * 1000;
};

const StatusPipeline = ({ project, currentView, setView, activeTab, setActiveTab }) => {
  const dispatch = useDispatch();
  const selectionRequests = useSelector(selectSelectionRequests) || [];
  const [activeDetailsStage, setActiveDetailsStage] = useState(null);
  const containerRef = useRef(null);

  const pendingRequest = selectionRequests.find(req => req.projectId === project?.id);

  // Close the details card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveDetailsStage(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    
  }, []);

  // Safe wrapper to format date inside tooltip
  const formatEventDate = (dateStr) => {
    try {
      return formatDateStyle02(dateStr);
    } catch {
      return new Date(dateStr).toLocaleDateString();
    }
  };

  const getStageDetails = (stage) => {
    switch (stage) {
      case 'Booking': {
        const isBooked = project?.status !== 'draft' || (project?.events && project.events.length > 0);
        return {
          status: isBooked ? 'completed' : 'active',
          label: isBooked ? 'Booking confirmed' : 'Booking in draft stage',
          info: isBooked 
            ? 'Project has been activated and booking is finalized.' 
            : 'Project is still in draft mode. Complete basic details to activate.',
          actionLabel: isBooked ? null : 'Activate Project',
          actionType: 'activate'
        };
      }
      case 'Crew': {
        if (!project?.events || project.events.length === 0) {
          return {
            status: 'pending',
            label: 'Pending events',
            info: 'No shoots or events have been created for this project yet.',
            actionLabel: 'Add Shoot Event',
            actionType: 'addEvent'
          };
        }
        
        // Critical: event in the next 48 hours or today with no crew
        const criticalEvent = project.events.find(e => {
          const isUrgent = isWithin48Hours(e.date) || isToday(e.date);
          const noCrew = !e.crews || e.crews.length === 0;
          return isUrgent && noCrew;
        });

        if (criticalEvent) {
          return {
            status: 'warning',
            isBlinking: true,
            label: 'Action Required: Crew missing',
            info: `Critical: The shoot on ${formatEventDate(criticalEvent.date)} has no crew assigned!`,
            actionLabel: 'Assign Crew Now',
            actionType: 'assignCrew'
          };
        }

        const allCrewAssigned = project.events.every(e => e.crews && e.crews.length > 0);
        if (allCrewAssigned) {
          return {
            status: 'completed',
            label: 'Crew fully assigned',
            info: 'All scheduled events have crew members assigned.',
            actionLabel: 'Manage Crew',
            actionType: 'assignCrew'
          };
        }

        return {
          status: 'warning',
          label: 'Partial crew assignment',
          info: 'Some scheduled events do not have crew assigned yet.',
          actionLabel: 'Assign Crew',
          actionType: 'assignCrew'
        };
      }
      case 'Shoot': {
        if (!project?.events || project.events.length === 0) {
          return {
            status: 'pending',
            label: 'No shoots scheduled',
            info: 'Schedule events/shoots to start tracking progress.',
            actionLabel: 'Schedule Shoot',
            actionType: 'addEvent'
          };
        }

        const hasTodayEvent = project.events.some(e => isToday(e.date));
        const allEventsPast = project.events.every(e => isPast(e.date));

        if (hasTodayEvent) {
          return {
            status: 'active',
            isBlinking: true,
            label: 'Shoot is active today!',
            info: 'An event is currently scheduled for today.',
            actionLabel: 'View Shoots',
            actionType: 'viewShoots'
          };
        }

        if (allEventsPast) {
          return {
            status: 'completed',
            label: 'Shoots completed',
            info: 'All scheduled shoots and events have concluded.',
            actionLabel: 'View Shoots',
            actionType: 'viewShoots'
          };
        }

        return {
          status: 'active',
          label: 'Upcoming shoots',
          info: 'There are future shoots scheduled.',
          actionLabel: 'View Shoots',
          actionType: 'viewShoots'
        };
      }
      case 'Upload': {
        const filesCount = project?.uploadedFilesCount || 0;
        const allEventsPast = project?.events && project.events.length > 0 && project.events.every(e => isPast(e.date));

        if (filesCount > 0) {
          return {
            status: 'completed',
            label: `${filesCount} photos uploaded`,
            info: `A total of ${filesCount} photos have been uploaded across collections.`,
            actionLabel: 'Upload More',
            actionType: 'uploadPhotos'
          };
        }

        if (allEventsPast) {
          return {
            status: 'warning',
            label: 'Action Required: Upload photos',
            info: 'All shoots are completed, but no photos have been uploaded yet.',
            actionLabel: 'Upload Photos',
            actionType: 'uploadPhotos'
          };
        }

        return {
          status: 'pending',
          label: 'Pending uploads',
          info: 'Photos will be uploaded once shoots are completed.',
          actionLabel: 'Upload Photos',
          actionType: 'uploadPhotos'
        };
      }
      case 'Selection': {
        if (project?.status === 'selected') {
          const selectedCount = project?.selectedFilesCount || 0;
          return {
            status: 'completed',
            label: 'Selection completed',
            info: `Client finalized selections (${selectedCount} photos selected).`,
            actionLabel: 'View Selections',
            actionType: 'viewSelections'
          };
        }

        if (pendingRequest) {
          return {
            status: 'warning',
            isBlinking: true,
            label: 'Selection reset requested',
            info: 'Client has requested to reset their selections to select again.',
            actionLabel: 'Review Request',
            actionType: 'respondReset'
          };
        }

        const hasActiveSelection = project?.collections?.some(c => c.selectionGallery === true || c.status === 'active');
        if (hasActiveSelection) {
          return {
            status: 'active',
            label: 'Client selecting',
            info: 'Selection is currently open. Waiting for client to submit selections.',
            actionLabel: 'Share Gallery Link',
            actionType: 'shareGallery'
          };
        }

        return {
          status: 'pending',
          label: 'Not started',
          info: 'Enable selection on a gallery to allow clients to select photos.',
          actionLabel: 'Enable Selection',
          actionType: 'viewGalleries'
        };
      }
      case 'Design': {
        const hasDesignedCollection = project?.collections?.some(c => c.sections && c.sections.length > 0);
        if (hasDesignedCollection) {
          return {
            status: 'completed',
            label: 'Gallery designed',
            info: 'At least one gallery collection has been custom designed with sections.',
            actionLabel: 'Customize Design',
            actionType: 'viewGalleries'
          };
        }

        if (project?.status === 'selected') {
          return {
            status: 'warning',
            label: 'Ready for layout design',
            info: 'Selection is completed. Customize the gallery layout design now.',
            actionLabel: 'Start Design',
            actionType: 'viewGalleries'
          };
        }

        return {
          status: 'pending',
          label: 'Pending design',
          info: 'Design can be customized once selection is complete or photos are uploaded.',
          actionLabel: 'Design Layout',
          actionType: 'viewGalleries'
        };
      }
      case 'Delivery': {
        const isCompleted = project?.status === 'completed' || project?.status === 'archived';
        if (isCompleted) {
          return {
            status: 'completed',
            label: project.status === 'archived' ? 'Project archived' : 'Delivered to client',
            info: project.status === 'archived' ? 'Project has been delivered and archived.' : 'Project is marked as completed.',
            actionLabel: 'Manage Delivery',
            actionType: 'shareGallery'
          };
        }

        const hasDesignedCollection = project?.collections?.some(c => c.sections && c.sections.length > 0);
        const isSelected = project?.status === 'selected';
        if (isSelected && hasDesignedCollection) {
          return {
            status: 'warning',
            label: 'Ready for final delivery',
            info: 'Selection and layout design are completed. Deliver the final gallery to the client.',
            actionLabel: 'Deliver Gallery',
            actionType: 'shareGallery'
          };
        }

        return {
          status: 'pending',
          label: 'Pending delivery',
          info: 'Delivery will be enabled after selection and design phases.',
          actionLabel: 'Deliver Gallery',
          actionType: 'shareGallery'
        };
      }
      case 'Payment': {
        const totalPayments = project?.payments?.reduce((acc, p) => acc + (p?.amount || 0), 0) || 0;
        const budgetAmount = project?.budgets?.amount || 0;

        if (!project?.budgets) {
          return {
            status: 'pending',
            label: 'Budget not set',
            info: 'Set a budget to start tracking payments.',
            actionLabel: 'Set Budget',
            actionType: 'addBudget'
          };
        }

        const balance = budgetAmount - totalPayments;
        if (balance <= 0) {
          return {
            status: 'completed',
            label: 'Fully paid',
            info: `Cleared! Total payments received: ₹ ${totalPayments / 1000} K.`,
            actionLabel: 'View Payments',
            actionType: 'viewFinancials'
          };
        }

        return {
          status: 'warning',
          label: `₹ ${balance / 1000} K pending`,
          info: `Paid: ₹ ${totalPayments / 1000} K of ₹ ${budgetAmount / 1000} K budget.`,
          actionLabel: totalPayments > 0 ? 'Record Payment' : 'Record Initial Payment',
          actionType: 'addPayment'
        };
      }
      default:
        return { status: 'pending', label: 'Pending' };
    }
  };

  const handleAction = (actionType) => {
    switch (actionType) {
      case 'activate': {
        const statusSelect = document.querySelector('.project-status select');
        if (statusSelect) {
          statusSelect.focus();
          statusSelect.style.outline = '2px solid #21ade4';
          setTimeout(() => { statusSelect.style.outline = ''; }, 2000);
        }
        break;
      }
      case 'viewGalleries':
        if (setView) setView('abstract');
        if (setActiveTab) setActiveTab('galleries');
        break;
      case 'viewShoots':
        if (setView) setView('dashboard');
        if (setActiveTab) setActiveTab('shoots');
        break;
      case 'viewFinancials':
        if (setView) setView('dashboard');
        if (setActiveTab) setActiveTab('financials');
        break;
      case 'addEvent':
        dispatch(openModal('addEvent'));
        break;
      case 'assignCrew':
        if (setView) setView('dashboard');
        if (setActiveTab) setActiveTab('shoots');
        // Let's trigger a modal after a small layout transition delay
        setTimeout(() => {
          dispatch(openModal('addCrew'));
        }, 100);
        break;
      case 'uploadPhotos':
        if (setView) setView('abstract');
        if (project?.collections?.length === 0) {
          dispatch(openModal('createCollection'));
        }
        break;
      case 'shareGallery':
        dispatch(openModal('shareGallery'));
        break;
      case 'addBudget':
        dispatch(openModal('addBudget'));
        break;
      case 'addPayment':
        dispatch(openModal('addPayment'));
        break;
      case 'viewSelections':
        if (setView) setView('abstract');
        break;
      case 'respondReset': {
        const requestItem = document.querySelector('.selection-requests-list');
        if (requestItem) {
          requestItem.scrollIntoView({ behavior: 'smooth' });
          requestItem.style.boxShadow = '0 0 15px rgba(33, 173, 228, 0.5)';
          setTimeout(() => { requestItem.style.boxShadow = ''; }, 2000);
        }
        break;
      }
      default:
        break;
    }
    setActiveDetailsStage(null);
  };

  const renderTab = (stage) => {
    const stageDetails = getStageDetails(stage);
    const isTabActive = currentView === 'dashboard'
      ? (stage === 'Crew' || stage === 'Shoot') && activeTab === 'shoots'
      : currentView === 'abstract' && (stage !== 'Crew' && stage !== 'Shoot' && stage !== 'Payment');

    const handleTabClick = (e) => {
      e.stopPropagation();
      setActiveDetailsStage(activeDetailsStage === stage ? null : stage);
    };

    return (
      <div 
        key={stage} 
        className={`pipeline-tab ${isTabActive ? 'active' : ''} ${activeDetailsStage === stage ? 'details-open' : ''}`}
        onClick={handleTabClick}
      >
        <div className={`led-indicator ${stageDetails.status} ${stageDetails.isBlinking ? 'led-blink' : ''}`} />
        <span className="tab-name">{stage}</span>
      </div>
    );
  };

  return (
    <div className="status-pipeline-container" ref={containerRef}>
      <div className="status-pipeline-wrapper">
        <div className="status-pipeline">
          {STAGES.map(renderTab)}
        </div>
        {renderTab('Payment')}
      </div>

      {activeDetailsStage && (() => {
        const details = getStageDetails(activeDetailsStage);
        return (
          <div className="pipeline-stage-details-card glass-card fade-in">
            <div className="card-header">
              <h4>{activeDetailsStage} Stage</h4>
              <span className={`status-badge ${details.status}`}>
                {details.status}
              </span>
            </div>
            <p className="stage-label">{details.label}</p>
            <p className="stage-info">{details.info}</p>
            {details.actionLabel && (
              <button 
                className="button primary small outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(details.actionType);
                }}
              >
                {details.actionLabel}
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default StatusPipeline;
