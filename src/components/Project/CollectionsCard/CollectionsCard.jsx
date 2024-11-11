import { Link } from 'react-router-dom';
import './CollectionsCard.scss';
import { useSelector } from 'react-redux';
import { selectUserStudio } from '../../../app/slices/authSlice';

function CollectionCard({ collection }) {
  const defaultStudio = useSelector(selectUserStudio);
  return (
    <Link 
      className={`collection ${collection.id} ${collection.type ? collection.type : ''} ${collection.status ? collection.status : ''}`} 
      to={`/${defaultStudio.domain}/gallery/${collection.projectId}/${collection.id}`} 
      key={collection.id}
    >
      <div className="cover-wrap">
        <div 
          className={"collection-cover "+collection.galleryCover}
          style={{
            backgroundImage: collection.galleryCover ? `url(${collection.galleryCover.replace(/\(/g, '%28').replace(/\)/g, '%29')})` : '',
            backgroundSize: collection.galleryCover ? 'cover' : '',
            backgroundBlendMode: collection.coverImage ? '' : 'soft-light',
          }}
        />
      </div>

      <div className="collection-details">
        <div className="details-top">
          <h4 className="collection-title">{collection.name}</h4>
          <p className="collection-type">{collection.type}</p>
        </div>

        <div className="collection-summary">
          <div className="summary-left">
            <div className={`summary-item photos-count ${collection.uploadedFilesCount > 0 ? 'active' : ''}`}>
              <div className="icon"></div>
              <p>{collection.filesCount}</p>
            </div>
          </div>
          <div className="summary-right">
              <div className="pin">
                <p className="pin-number"> Open Gallery</p>
              </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CollectionCard;
