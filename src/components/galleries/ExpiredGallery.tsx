import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, CheckCircle, LayoutDashboard } from 'lucide-react';
import { requestExtension } from '../../app/slices/extensionRequestSlice';
import styles from './ExpiredGallery.module.scss';

export type UserRole = 'photographer' | 'client' | 'guest';

interface ExpiredGalleryProps {
  expiryDate: Date | number;
  photographerName: string;
  backgroundImage: string;
  projectId: string;
  projectName: string;
  domain: string;
  role: UserRole;
}

const ExpiredGallery: React.FC<ExpiredGalleryProps> = ({
  expiryDate,
  photographerName,
  backgroundImage,
  projectId,
  projectName,
  domain,
  role,
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
      // TODO: Optionally show an error to the user
    } finally {
      setIsLoading(false);
    }
  };

  const formattedExpiryDate = expiryDate ? format(new Date(expiryDate), 'MMM dd, yyyy') : '';
  const isPhotographer = role === 'photographer';
  const isGuest = role === 'guest';

  return (
    <div className={styles.expiredGallery}>
      <div
        className={`${styles.backgroundOverlay} ${isImageLoaded ? styles.loaded : ''}`}
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className={styles.glassCard}>
        <div className={styles.iconWrapper}>
          <Clock size={48} />
        </div>
        <h1 className={styles.title}>
          {isPhotographer ? 'Your gallery link has expired' : 'This link has expired'}
        </h1>
        {formattedExpiryDate && (
          <p className={styles.subheadline}>
            {isPhotographer ? (
              <>
                This gallery expired on <strong>{formattedExpiryDate}</strong>. It is no longer visible to your clients.
              </>
            ) : (
              <>
                This gallery, shared by <strong>{photographerName}</strong>, expired on{' '}
                <strong>{formattedExpiryDate}</strong>.
              </>
            )}
          </p>
        )}
        <p className={styles.message}>
          {isPhotographer
            ? 'To regain access for your clients, you can extend the validity in the project settings.'
            : 'To regain access, you can request a short extension from the photographer.'}
        </p>

        {!isGuest && (
          <button
            className={`${styles.requestButton} ${isRequested ? styles.requested : ''}`}
            onClick={isPhotographer ? () => navigate(`/${domain}/project/${projectId}`) : handleRequestExtension}
            disabled={(!isPhotographer && isRequested) || isLoading}
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
