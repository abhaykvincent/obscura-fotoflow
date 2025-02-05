import React from 'react';
import { Link } from 'react-router-dom';
import './NotificationCard.scss'; // Import your styles
import { getTimeAgo } from '../../utils/dateUtils';

/**
 * NotificationCard Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Notification title
 * @param {string} props.message - Notification message/content
 * @param {string} props.type - Notification type (e.g., 'system', 'security', 'project')
 * @param {boolean} props.recent - Whether the notification is recent (e.g., within the last 7 days)
 * @param {string} props.actionLink - Link to navigate when the notification is clicked
 * @param {string} props.createdAt - Timestamp of when the notification was created
 * @param {boolean} props.isRead - Whether the notification has been read
 * @returns {JSX.Element} - Rendered NotificationCard component
 */
const NotificationCard = ({ 
  title, 
  message, 
  type, 
  recent, 
  actionLink, 
  metadata, 
  isRead 
}) => {
  // Determine the icon based on the notification type
  const getIcon = () => {
    switch (type) {
      case 'security':
        return '🔒';
      case 'project':
        return '📁';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  return (
    <div className={`notification-card ${recent ? 'recent' : ''} ${isRead ? 'read' : 'unread'}`}>
      <div className="notification-icon left">
        {getIcon()}
      </div>
      <div className="notification-content">
        <h3 className="notification-title">{title}</h3>
        <p className="notification-message">{message}</p>
        
      </div>
      <div className="notification-footer">
          <span className="notification-date">{getTimeAgo(metadata.createdAt) }</span>
          {/* {actionLink && (
            <Link to={actionLink} className="notification-action">
              View Details
            </Link>
          )} */}
        </div>
    </div>
  );
};

export default NotificationCard;