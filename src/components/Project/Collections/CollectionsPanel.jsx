import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';

const ProjectCollections = ({ project, collectionId}) => {
  const dispatch = useDispatch();
  const findIndexofCollection = (collectionId) => {
    return project.collections.findIndex((collection) => collection.id === collectionId);
  };
  const index = findIndexofCollection(collectionId);
  const activeBox = document.querySelector('.active-box');
  if (activeBox) {
    activeBox.style.left = `${index * 8 * 27.2 + 8 * 4}px`;
  }

  return<div className="galleries">
    <div className="list">
      {
      project.collections.length > 0 ? 
        <div className="gallery-list">
          {project.collections.map((collection) => (
            
            collection.pin=="" ?
            <div className={`gallery  no-images `} key={collection.id} onClick={()=>{}}>
              <div className="thumbnails">
                <div className="thumbnail thumb1">
                  <div className="backthumb bthumb1"></div>
                  <div className="backthumb bthumb2"></div>
                  <div className="backthumb bthumb3"></div>
                </div>
                
              </div>
              <div className="gallery-name">Upload Photos</div>
              
            </div>
            : <Link className={`gallery ${collectionId===collection.id && 'active'}`} to={`/project/galleries/${project.id}/${collection.id}`}>
                <div className="thumbnails">
                  <div className="thumbnail thumb1">
                    <div className="backthumb bthumb1"
                    style={
                      { 
                        backgroundImage: 
                        `url(${project.projectCover!=""?project.projectCover:'https://img.icons8.com/external-others-abderraouf-omara/64/FFFFFF/external-images-photography-and-equipements-others-abderraouf-omara.png'})`,
                        backgroundSize:`${project.projectCover!=""?'':'50%'}`

                      }}
                    ></div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
                  <div className="thumbnail thumb2">
                    <div className="backthumb bthumb1"style={{ 
                        backgroundImage: `url(${project.projectCover!==""?project.projectCover:'https://img.icons8.com/external-others-abderraouf-omara/64/FFFFFF/external-images-photography-and-equipements-others-abderraouf-omara.png'})`,
                        backgroundSize:`${project.projectCover!=""?'':'50%'}`
                      }}>
                    </div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
                  <div className="thumbnail thumb3">
                    <div className="backthumb bthumb1 count">{project.uploadedFilesCount } Photos</div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
                </div>
                <div className="gallery-name">{collection.name}</div>
              </Link>

            
          ))}
          <div className="active-box box"></div>
        </div>:''
      }
      <div className="gallery new" 
        onClick={() => dispatch(openModal('createCollection'))}>
        <div className="thumbnails">
          <div className="thumbnail thumb1">
            <div className="backthumb bthumb1"></div>
            <div className="backthumb bthumb2"></div>
            <div className="backthumb bthumb3"></div>
            <div className="backthumb bthumb4"></div>
          </div>
        </div>
        <div className="gallery-name">New Gallery</div>
      </div>
    </div>
  </div>
}
export default ProjectCollections;