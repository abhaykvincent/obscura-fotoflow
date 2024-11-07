import {Link} from 'react-router-dom';
import './ProjectCard.scss'
import { selectStudio } from '../../../app/slices/studioSlice';
import { useSelector } from 'react-redux';
import { selectUserStudio } from '../../../app/slices/authSlice';

function ProjectCard({project}) {   
  const defaultStudio = useSelector(selectUserStudio)
  return (
    <Link className={`project ${project.id} ${project.type?project.type:''} ${project.status?project.status:''}`} to={`/${defaultStudio.domain}/project/${project.id}`} key={project.id}>
        <div className="cover-wrap">
            <div className="project-cover"
            style={{
                backgroundImage: project.projectCover ?`url(${project.projectCover.replace(/\(/g, '%28').replace(/\)/g, '%29')})` : '',
                backgroundSize: project.projectCover ? 'cover' : '',
                backgroundBlendMode: project.projectCover ? '' : 'soft-light',
            }}
            />
        </div>
        <div className="project-details">
            <div className="details-top">
                <div className="left">
                    <h4 className="project-title">{project.name}</h4>
                    <p className="project-type">{project.type}</p>
                    <div className="info-bar">
                        <div className="">{project?.budgets?.amount &&<p className=" project-budget tag"> ₹ {project?.budgets?.amount}</p>}
                        </div>
                       {/*  open in Lightroom  */}
                       <div className={`button lr mini ${project.status==="selected"?'':'disabled'}`}>Lr</div>
                    </div>
                </div>
                <div className="right">
                    <div className="status-signal"></div>
                </div>
            </div>
            { project.collections.length === 0 ?
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
            }
        </div>
        
    </Link>
    );
}

    export default ProjectCard;
