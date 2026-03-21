import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { Clock, CheckCircle } from 'lucide-react';
import { requestExtension } from '../../app/slices/extensionRequestSlice';
import styles from './ExpiredGallery.module.scss';

interface ExpiredGalleryProps {
  expiryDate: Date | number;
  photographerName: string;
  backgroundImage: string;
  projectId: string;
  projectName: string;
  domain: string;
}

const ExpiredGallery: React.FC<ExpiredGalleryProps> = ({
  expiryDate,
  photographerName,
  backgroundImage,
  projectId,
  projectName,
  domain,
}) => {
  const dispatch = useDispatch();
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
        <h1 className={styles.title}>This link has expired</h1>
        {formattedExpiryDate && (
          <p className={styles.subheadline}>
            This gallery, shared by <strong>{photographerName}</strong>, expired on{' '}
            <strong>{formattedExpiryDate}</strong>.
          </p>
        )}
        <p className={styles.message}>
          To regain access, you can request a short extension from the photographer.
        </p>
        <button
          className={`${styles.requestButton} ${isRequested ? styles.requested : ''}`}
          onClick={handleRequestExtension}
          disabled={isRequested || isLoading}
        >
          {isLoading ? (
            <div className={styles.spinner} />
          ) : isRequested ? (
            <>
              <CheckCircle size={20} />
              Request Sent
            </>
          ) : (
            'Request Extension'
          )}
        </button>
      </div>
    </div>
  );
};

export default ExpiredGallery;
