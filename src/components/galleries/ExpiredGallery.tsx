import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, CheckCircle, LayoutDashboard, CalendarOff } from 'lucide-react';
import { requestExtension } from '../../app/slices/extensionRequestSlice';
import styles from './ExpiredGallery.module.scss';

export type UserRole = 'photographer' | 'client' | 'guest';
export type GalleryStatus = 'archived' | 'expired';

interface ExpiredGalleryProps {
  expiryDate: Date | number;
  photographerName: string;
  backgroundImage: string;
  projectId: string;
  projectName: string;
  domain: string;
  role: UserRole;
  type: GalleryStatus;
}

const ExpiredGallery: React.FC<ExpiredGalleryProps> = ({
  expiryDate,
  photographerName,
  backgroundImage,
  projectId,
  projectName,
  domain,
  role,
  type,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => setIsImageLoaded(true);
  }, [backgroundImage]);

  const handleRequestExtension = async () => {
    setIsLoading(true);
    try {
      await dispatch(requestExtension({ domain, projectId, projectName })).unwrap();
      setIsRequested(true);
    } catch (error) {
      console.error('Failed to send extension request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedExpiryDate = expiryDate ? format(new Date(expiryDate), 'MMM dd, yyyy') : '';
  const isPhotographer = role === 'photographer';
  const isGuest = role === 'guest';
  const isExpired = type === 'expired';

  return (
    <div className={styles.expiredGallery}>
      <div
        className={`${styles.backgroundOverlay} ${isImageLoaded ? styles.loaded : ''}`}
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className={styles.glassCard}>
        <div className={styles.iconWrapper}>
          {isExpired ? <CalendarOff size={48} /> : <Clock size={48} />}
        </div>
        <h1 className={styles.title}>
          {isPhotographer 
            ? (isExpired ? 'Your gallery has expired' : 'Your gallery link has archived')
            : (isExpired ? 'This gallery has expired' : 'This link has archived')}
        </h1>
        {formattedExpiryDate && (
          <p className={styles.subheadline}>
            {isPhotographer ? (
              <>
                This gallery {isExpired ? 'expired' : 'archived'} on <strong>{formattedExpiryDate}</strong>. 
                {isExpired ? ' Files may be deleted soon according to your retention policy.' : ' It is no longer visible to your clients.'}
              </>
            ) : (
              <>
                This gallery, shared by <strong>{photographerName}</strong>, {isExpired ? 'expired' : 'archived'} on{' '}
                <strong>{formattedExpiryDate}</strong>.
              </>
            )}
          </p>
        )}
        <p className={styles.message}>
          {isPhotographer
            ? (isExpired 
                ? 'To restore this gallery, you need to update the project status and retention settings.' 
                : 'To regain access for your clients, you can extend the validity in the project settings.')
            : (isExpired
                ? 'The files for this project have reached their retention limit. Please contact the photographer directly for any inquiries.'
                : 'To regain access, you can request a short extension from the photographer.')}
        </p>

        {!isGuest && (
          <button
            className={`${styles.requestButton} ${isRequested ? styles.requested : ''}`}
            onClick={isPhotographer ? () => { console.log(`/${domain}/project/${projectId}`);debugger;navigate(`/${domain}/project/${projectId}`)} : handleRequestExtension}
            disabled={(!isPhotographer && (isRequested || isExpired)) || isLoading}
          >
            {isLoading ? (
              <div className={styles.spinner} />
            ) : isRequested ? (
              <>
                <CheckCircle size={20} />
                Request Sent
              </>
            ) : isPhotographer ? (
              <>
                <LayoutDashboard size={20} />
                Manage Project
              </>
            ) : isExpired ? (
              'Contact Photographer'
            ) : (
              'Request Extension'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpiredGallery;
