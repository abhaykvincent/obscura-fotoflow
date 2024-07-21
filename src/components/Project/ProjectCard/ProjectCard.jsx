import {Link} from 'react-router-dom';
import './ProjectCard.scss'

function ProjectCard({project}) {   
    //Project's selected photos count
    const getProjectSelectedPhotosCount = (project) => {
        return project.collections.flatMap(collection => collection.uploadedFiles)
            .filter(image => image?.status === 'selected')
            .length;
    }
  return (
    <Link className={`project ${project.id} ${project.type?project.type:''} ${project.status?project.status:''}`} to={`/project/${project.id}`} key={project.id}>
        <div className="cover-wrap">
            <div
                className="project-cover"
                style={{
                    backgroundImage: project.projectCover ? `url(${project.projectCover})` : '',
                    backgroundSize: project.projectCover ? 'cover' : '',
                }}
            />
        </div>
        <div className="project-details">
            <div className="details-top">
                <div className="left">
                    <h4 className="project-title">{project.name}</h4>
                    <p className="project-type">{project.type}</p>
            
                </div>
                <div className="right">
                    <div className="status-signal"></div>
                </div>
            </div>
            {
                project.collections.length === 0 ?
                    <div className="empty-message">
                        Upload your snaps
                    </div> :
                    <div className="project-summary">
                        <div className="summary-left">
                            <div className={`summary-item photos-count ${project.uploadedFilesCount>0?'active':''}`}>
                                <div className="icon"></div>
                                <p>{project.uploadedFilesCount}</p>
                            </div>
                            <div className={`summary-item collection-count ${project.collections.length>0?'active':''}`}>
                                <div className="icon"></div>
                                <p>{project.collections.length}</p>
                            </div>
                            <div className={`summary-item invoice-count ${project.payments.length>0?'active':''}`}>
                                <div className="icon"></div>
                                <p>{project.payments.length}</p>
                            </div>
                            

                        </div>
                        <div className="summary-right">     
                        {
                            // if pin available, show pin number  
                            project.pin ?
                            <div className="pin">
                                <p className="pin-label"></p>
                                <p className="pin-number">{project.pin}</p>
                            </div>
                            : ''
                        }
                            
                        </div>
                        
                    </div>
            }
        </div>
        
    </Link>
    );
}

    export default ProjectCard;
