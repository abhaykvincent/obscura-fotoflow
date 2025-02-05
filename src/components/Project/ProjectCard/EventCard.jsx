import {Link} from 'react-router-dom';
import './ProjectCard.scss'
import { useSelector } from 'react-redux';
import { selectUserStudio } from '../../../app/slices/authSlice';

function EventCard({event}) {   
  const defaultStudio = useSelector(selectUserStudio)
  return (
    <Link className={`project ${event.id} ${event.type?event.type:''} `} to={`/${defaultStudio.domain}/project/${event.id}`} key={event.id}
    >
        <div className="cover-wrap">
            <div className="project-cover"
            style={{
                /* backgroundImage: project.projectCover ?`url(${project.projectCover.replace(/\(/g, '%28').replace(/\)/g, '%29')})` : '',
                backgroundSize: project.projectCover ? 'cover' : '',
                backgroundBlendMode: project.projectCover ? '' : 'soft-light', */
            }}
            />
        </div>
        <div className="project-details">
            <div className="details-top">
                <div className="left">
                    <h4 className="project-title">{event.name}</h4>
                    <p className="project-type">{event.type}</p>
                    {/* <div className="info-bar">
                        <div className="">{project?.budgets?.amount &&<p className=" project-budget tag"> ₹ {project?.budgets?.amount}</p>}
                        </div>
                       <div className={`button lr mini ${project.status==="selected"?'':'disabled'}`}>Lr</div>
                    </div> */}
                </div>
                <div className="right">
                    <div className="status-signal"></div>
                </div>
            </div>
            {/* { project.collections.length === 0 ?
                <div className="empty-message">Upload your snaps</div> :
                <div className="project-summary">
                    <div className="summary-left">
                        <div className={`summary-item collection-count ${project.collections.length>0?'active':''}`}>
                            <div className="icon"></div>
                            <p>{project.collections.length}</p>
                        </div>
                        <div className={`summary-item photos-count ${project.uploadedFilesCount>0?'active':''}`}>
                            <div className="icon"></div>
                            <p>{project.uploadedFilesCount}</p>
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
            } */}
        </div>
        
    </Link>
    );
}

    export default EventCard;
