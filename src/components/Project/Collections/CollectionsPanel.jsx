import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';
import { positionCollectionsActiveBox } from '../../../utils/UI/collectionActiveBox';
import { selectStudio } from '../../../app/slices/studioSlice';
import { selectUserStudio } from '../../../app/slices/authSlice';

const CollectionsPanel = ({ project, collectionId}) => {
  const dispatch = useDispatch();
  const defaultStudio = useSelector(selectUserStudio)
  positionCollectionsActiveBox(collectionId,project.collections)

  return <div className="galleries">
    <div className="list">
      
      {
      project.collections.length > 0 ? 
        <div className="gallery-list">
          <div className="gallery new" 
            onClick={() => dispatch(openModal('createCollection'))}>
            <div className="thumbnails">
              <div className="thumbnail thumb1">
                <div className="backthumb bthumb1">
                </div>
                <p>Create Gallery</p>
              </div>
            </div>
          </div>
          {project.collections.map((collection) => (
            
            collection.pin=="" ?
              <div className={`gallery  no-images `} key={collection.id} onClick={()=>{}}>
                <div className="thumbnails">
                  <div className="thumbnail thumb1">
                    <div className={`backthumb bthumb1 ${collection.galleryCover.replace(/\(/g, '%28').replace(/\)/g, '%29')}`}
                    style={{
                      backgroundImage: collection?.galleryCover 
                        ? `url("${collection.galleryCover.replace(/\(/g, '%28').replace(/\)/g, '%29')}")` 
                        : 'url(https://img.icons8.com/?size=100&id=UVEiJZnIRQiE&format=png&color=333333)',
                      backgroundSize: collection?.galleryCover ? 'cover' : '40%',
                    }}
                    
                    >

                      
                    </div>
                  </div>
                </div>
                <div className="gallery-name">Upload</div>
              </div>
            : <Link  key={collection.id} className={`gallery ${collectionId===collection.id && 'active'}`} to={`/${defaultStudio.domain}/gallery/${project.id}/${collection.id}`}>
                <div className="thumbnails">
                  <div className="thumbnail thumb1">
                  <div className={`backthumb bthumb1 ${decodeURIComponent(collection.galleryCover)}`}
                    style={{
                      backgroundImage: collection?.galleryCover 
                        ? `url("${collection.galleryCover.replace(/\(/g, '%28').replace(/\)/g, '%29')}")` 
                        : 'url(https://img.icons8.com/?size=100&id=UVEiJZnIRQiE&format=png&color=333333)',
                      backgroundSize: collection?.galleryCover ? 'cover' : '40%',
                    }}
                    
                    >
{
                          collection?.filesCount ?
                  <div className="filesCount">
                         {collection?.filesCount+' Photos'
                        } 
                      </div>:''
                      }
                    </div>

                  </div>
                </div>
                <div className="gallery-name">
                  
                  <p>
                  {collection.name}
                  </p>
                  
                  </div>
              </Link>

            
          ))}
          
          {/* <div className="active-box box"></div> */}
        </div>:''
      }
      
    </div>
  </div>
}
export default CollectionsPanel;
// Line Complexity  0.9 -> 