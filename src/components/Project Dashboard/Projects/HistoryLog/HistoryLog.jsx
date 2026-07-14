import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logProjectActivity } from '../../../../app/slices/projectsSlice';
import { selectUserStudio } from '../../../../app/slices/authSlice';
import { showAlert } from '../../../../app/slices/alertSlice';
import { selectSelectionRequests } from '../../../../app/slices/selectionRequestSlice';
import './HistoryLog.scss';

// Dynamic Date Formatter
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function HistoryLog({ project }) {
  const dispatch = useDispatch();
  const defaultStudio = useSelector(selectUserStudio);
  const selectionRequests = useSelector(selectSelectionRequests);
  const [filter, setFilter] = useState('all');
  const [simulationLoading, setSimulationLoading] = useState(false);

  // Compile all activities from existing project data structure & activityLog
  const activities = useMemo(() => {
    if (!project) return [];

    const list = [];

    // 1. Project Creation
    if (project.createdAt) {
      list.push({
        id: `created-${project.id}`,
        timestamp: new Date(project.createdAt).getTime(),
        type: 'lifecycle',
        title: 'Project Created',
        description: `Project "${project.name}" was successfully initialized.`,
        icon: '📁',
        by: 'Studio',
        colorClass: 'lifecycle-color'
      });
    } else if (project.storage?.storageHistory?.[0]?.dateMoved) {
      list.push({
        id: `created-fallback-${project.id}`,
        timestamp: project.storage.storageHistory[0].dateMoved,
        type: 'lifecycle',
        title: 'Project Created',
        description: `Project "${project.name}" was successfully initialized.`,
        icon: '📁',
        by: 'Studio',
        colorClass: 'lifecycle-color'
      });
    }

    // 2. Storage & Status History
    if (project.storage?.storageHistory) {
      project.storage.storageHistory.forEach((hist, idx) => {
        list.push({
          id: `storage-hist-${idx}`,
          timestamp: hist.dateMoved,
          type: 'lifecycle',
          title: `Storage Moved to ${hist.status.toUpperCase()}`,
          description: `Project storage pipeline updated to "${hist.status}".`,
          icon: hist.status === 'archive' ? '📦' : '⚡',
          by: 'System',
          colorClass: 'lifecycle-color'
        });
      });
    }

    // 3. Collections (Galleries)
    if (project.collections) {
      project.collections.forEach((col) => {
        // Creation of Gallery
        const colTimestamp = col.smartGallery?.createdAt || project.createdAt || Date.now();
        list.push({
          id: `col-created-${col.id}`,
          timestamp: new Date(colTimestamp).getTime(),
          type: 'gallery',
          title: 'Gallery Added',
          description: `New gallery "${col.name}" was added to project.`,
          icon: '🖼️',
          by: 'Studio',
          colorClass: 'gallery-color'
        });

        // Gallery Selection Status
        if (col.selectionGallery) {
          list.push({
            id: `col-selection-enabled-${col.id}`,
            timestamp: new Date(colTimestamp).getTime() + 1000, // slightly after creation
            type: 'gallery',
            title: 'Selection Enabled',
            description: `Client proofing/image selection enabled for "${col.name}".`,
            icon: '✅',
            by: 'Studio',
            colorClass: 'gallery-color'
          });
        }

        // Favorites
        if (col.favoriteImages && col.favoriteImages.length > 0) {
          list.push({
            id: `col-favs-${col.id}`,
            timestamp: Date.now() - 3600000 * 4, // Mock dynamic client action time
            type: 'client',
            title: 'Favorites Submitted',
            description: `Client marked ${col.favoriteImages.length} images as favorites in "${col.name}".`,
            icon: '❤️',
            by: 'Client',
            colorClass: 'client-color'
          });
        }
      });
    }

    // 4. Shoots & Events
    if (project.events) {
      project.events.forEach((evt) => {
        const evtTimestamp = evt.date ? new Date(evt.date).getTime() : Date.now();
        list.push({
          id: `event-${evt.id}`,
          timestamp: evtTimestamp,
          type: 'shoot',
          title: 'Shoot Scheduled',
          description: `Shoot of type "${evt.type}" scheduled at ${evt.location || 'studio'}.`,
          icon: '📸',
          by: 'Studio',
          colorClass: 'shoot-color'
        });

        if (evt.crews && evt.crews.length > 0) {
          list.push({
            id: `event-crew-${evt.id}`,
            timestamp: evtTimestamp + 500,
            type: 'shoot',
            title: 'Crew Assigned',
            description: `Assigned crew: ${evt.crews.map(c => c.name || c).join(', ')}.`,
            icon: '👥',
            by: 'Studio',
            colorClass: 'shoot-color'
          });
        }
      });
    }

    // 5. Payments & Invoices
    if (project.payments) {
      project.payments.forEach((pay, idx) => {
        const payTimestamp = pay.date ? new Date(pay.date).getTime() : Date.now();
        list.push({
          id: `pay-${idx}`,
          timestamp: payTimestamp,
          type: 'financial',
          title: 'Payment Received',
          description: `Payment of ${defaultStudio?.currencySymbol || '$'}${pay.amount} received via ${pay.method || 'payment'} (${pay.status}).`,
          icon: '💵',
          by: 'Studio',
          colorClass: 'financial-color'
        });
      });
    }

    // 6. Expenses
    if (project.expenses) {
      project.expenses.forEach((exp, idx) => {
        const expTimestamp = exp.date ? new Date(exp.date).getTime() : Date.now();
        list.push({
          id: `exp-${idx}`,
          timestamp: expTimestamp,
          type: 'financial',
          title: 'Expense Recorded',
          description: `Recorded expense of ${defaultStudio?.currencySymbol || '$'}${exp.amount} for "${exp.category || 'general'}".`,
          icon: '💸',
          by: 'Studio',
          colorClass: 'financial-color'
        });
      });
    }

    // 7. Selection Requests
    const projectRequests = selectionRequests.filter(req => req.projectId === project.id);
    projectRequests.forEach((req) => {
      list.push({
        id: `sel-req-${req.id}`,
        timestamp: req.createdAt ? new Date(req.createdAt).getTime() : Date.now(),
        type: 'client',
        title: 'Selection Reset Requested',
        description: `Client requested to select images again for gallery "${req.projectName || project.name}".`,
        icon: '🔄',
        by: 'Client',
        colorClass: 'client-color'
      });
    });

    // 8. Invitation metadata
    if (project.invitation) {
      const invite = project.invitation;
      const inviteClientName = invite.groomName && invite.brideName 
        ? `${invite.groomName} & ${invite.brideName}` 
        : invite.title || 'Client';

      if (invite.sentAt) {
        list.push({
          id: `invite-sent-${invite.id}`,
          timestamp: new Date(invite.sentAt).getTime(),
          type: 'client',
          title: 'Invitation Sent',
          description: `Invitation gallery sent to client (${inviteClientName}).`,
          icon: '✉️',
          by: 'Studio',
          colorClass: 'client-color'
        });
      }

      if (invite.viewedAt) {
        list.push({
          id: `invite-viewed-${invite.id}`,
          timestamp: new Date(invite.viewedAt).getTime(),
          type: 'client',
          title: 'Gallery Viewed',
          description: `Client (${inviteClientName}) viewed the online gallery link.`,
          icon: '👁️',
          by: 'Client',
          colorClass: 'client-color'
        });
      }

      if (invite.downloadedAt) {
        list.push({
          id: `invite-downloaded-${invite.id}`,
          timestamp: new Date(invite.downloadedAt).getTime(),
          type: 'client',
          title: 'Gallery Downloaded',
          description: `Client (${inviteClientName}) downloaded project images zip file.`,
          icon: '📥',
          by: 'Client',
          colorClass: 'client-color'
        });
      }
    }

    // 9. Dedicated activityLog stored in Firestore
    if (project.activityLog && Array.isArray(project.activityLog)) {
      project.activityLog.forEach((act) => {
        list.push({
          id: act.id,
          timestamp: act.timestamp || Date.now(),
          type: act.type || 'client',
          title: act.title,
          description: act.description,
          icon: act.icon || '📝',
          by: act.by || 'Client',
          colorClass: act.type === 'client' ? 'client-color' : act.type === 'financial' ? 'financial-color' : act.type === 'shoot' ? 'shoot-color' : 'lifecycle-color'
        });
      });
    }

    // Sort by timestamp descending (newest first)
    const sorted = list.sort((a, b) => b.timestamp - a.timestamp);

    // Filter duplicates by description + timestamp proximity
    const uniqueList = [];
    sorted.forEach((item) => {
      const duplicate = uniqueList.find(
        (u) => u.title === item.title && Math.abs(u.timestamp - item.timestamp) < 5000
      );
      if (!duplicate) {
        uniqueList.push(item);
      }
    });

    return uniqueList;
  }, [project, selectionRequests, defaultStudio]);

  // Filtering Logic
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;

    console.log(activities.filter((act) => act.type === filter));
    return activities.filter((act) => act.type === filter);
  }, [activities, filter]);

  // Simulation handler to show how client tracks work
  const handleSimulation = async (type) => {
    if (simulationLoading) return;
    setSimulationLoading(true);

    try {
      let activityEntry = {};
      const clientName = project.invitation?.groomName && project.invitation?.brideName
        ? `${project.invitation.groomName} & ${project.invitation.brideName}`
        : 'Client';

      if (type === 'view') {
        activityEntry = {
          type: 'client',
          title: 'Gallery Viewed (Simulation)',
          description: `Client "${clientName}" accessed and viewed the gallery online.`,
          icon: '👁️',
          by: 'Client'
        };
      } else if (type === 'download') {
        activityEntry = {
          type: 'client',
          title: 'Gallery Downloaded (Simulation)',
          description: `Client "${clientName}" downloaded the original digital files package.`,
          icon: '📥',
          by: 'Client'
        };
      } else if (type === 'fav') {
        activityEntry = {
          type: 'client',
          title: 'Images Favorited (Simulation)',
          description: `Client "${clientName}" selected and favorited 5 new photos.`,
          icon: '❤️',
          by: 'Client'
        };
      }

      await dispatch(logProjectActivity({
        domain: defaultStudio.domain,
        projectId: project.id,
        activityEntry
      })).unwrap();

      dispatch(showAlert({ type: 'success', message: `${activityEntry.title} logged successfully!` }));
    } catch (err) {
      dispatch(showAlert({ type: 'error', message: 'Failed to simulate client activity.' }));
      console.error(err);
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div className="history-log-panel">
      <div className="panel-header">
        <div className="title-section">
          <h3 className="heading">History Log & Activity Feed</h3>
          <p className="subtitle">Track client gallery interactions, project lifecycle milestones, shoots and financials.</p>
        </div>

        {/* Categories / Filter Bar */}
        <div className="filter-bar">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Logs ({activities.length})
          </button>
          <button
            className={`filter-btn client ${filter === 'client' ? 'active' : ''}`}
            onClick={() => setFilter('client')}
          >
            Client Activity
          </button>
          <button
            className={`filter-btn lifecycle ${filter === 'lifecycle' ? 'active' : ''}`}
            onClick={() => setFilter('lifecycle')}
          >
            Project Stages
          </button>
          <button
            className={`filter-btn shoot ${filter === 'shoot' ? 'active' : ''}`}
            onClick={() => setFilter('shoot')}
          >
            Shoots
          </button>
          <button
            className={`filter-btn financial ${filter === 'financial' ? 'active' : ''}`}
            onClick={() => setFilter('financial')}
          >
            Financials
          </button>
        </div>
      </div>

      <div className="panel-body">
        {/* Main Feed Timeline */}
        <div className="timeline-container">
          {filteredActivities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h4 className="empty-title">No matching activity found</h4>
              <p className="empty-text">Perform operations, add financials, or simulate client interactions below to view live feed.</p>
            </div>
          ) : (
            <div className="timeline-list">
              <div className="timeline-line"></div>
              {filteredActivities.map((act) => (
                <div className="timeline-item" key={act.id}>
                  {/* Timeline Badge */}
                  <div className={`timeline-badge ${act.colorClass}`}>
                    <span className="badge-icon">{act.icon}</span>
                  </div>

                  {/* Timeline Card */}
                  <div className="timeline-card glass">
                    <div className="card-header">
                      <h4 className="card-title">{act.title}</h4>
                      <span className="card-time">{formatTimeAgo(act.timestamp)}</span>
                    </div>
                    <p className="card-description" dangerouslySetInnerHTML={{ __html: act.description }}></p>
                    <div className="card-footer">
                      <span className="by-badge">{act.by}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Debug & Simulator Panel */}
        <div className="simulator-panel glass">
          <h4 className="sim-heading">Live Interaction Simulator</h4>
          <p className="sim-text">Need to test how a client interaction looks on the timeline? Trigger simulated client actions below to see live updates instantly:</p>
          <div className="sim-actions">
            <button
              className="button secondary outline small icon view"
              disabled={simulationLoading}
              onClick={() => handleSimulation('view')}
            >
              👁️ View Gallery
            </button>
            <button
              className="button secondary outline small icon download"
              disabled={simulationLoading}
              onClick={() => handleSimulation('download')}
            >
              📥 Download Zip
            </button>
            <button
              className="button secondary outline small icon favorite"
              disabled={simulationLoading}
              onClick={() => handleSimulation('fav')}
            >
              ❤️ Favorite Images
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryLog;
