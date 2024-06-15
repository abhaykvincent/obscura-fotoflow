import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { findCollectionById } from '../../utils/CollectionQuery';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';

export default function Project({ projects,  addCollection, deleteCollection, deleteProject,setUploadList,setUploadStatus,showAlert}) {
  const navigate = useNavigate();
  // Route Params
  let { id,collectionId } = useParams();
  // Modal
  const [modal, setModal] = useState({createCollection: false})
  const openModal = () => setModal({ createCollection: true });
  const closeModal = () => setModal({ createCollection: false });
  // Delete Project Modal
  const[confirmDeleteProject,setConfirmDeleteProject] = useState(false)
  const onDeleteConfirmClose = () => setConfirmDeleteProject(false)
  const onDeleteConfirm = () => deleteProject(id);

  // If no projects are available, return early
  if (!projects) return;
  // Find the project with the given id
  const project = projects.find((p) => p.id === id);
  console.log(project)
  // If the project is not found, redirect to the projects page and return
  if (!project) {
    setTimeout(()=>{
      navigate('/projects');
    },100)
    return;
  }
  else{
  document.title = `${project.name}'s ${project.type}`
  }


  return (
    <main className='project-page'>
      <div className="project-info">
        <div className="client">
          <Link className="back" to="/projects"></Link>
          <h1>{project.name}</h1>
          <div className="type">{project.type}</div>
        </div>
        <div className="project-options">
          <a className="button primary share" href={`/share/${id}`} target="_blank">Share</a>
          <a className="button primary selection" href={`/selection/${id}`} target="_blank">Selection</a>
          <div className="button warnning" onClick={()=>{
            setConfirmDeleteProject(true)
          }}>Delete</div>
        </div>
        <div className="client-contact">
          <p className="client-phone">{project.phone}</p>
          <p className="client-email">{project.email}</p>
        </div>
        <div className="project-options">PIN 
          {/* display project pin and a click buttion to copy to clicp board */}
          <div className="button secondary pin" onClick={()=>{
            navigator.clipboard.writeText(`${project.pin}`)
            showAlert('success', 'Pin copied to clipboard!')
          }}>{project.pin}</div>
        </div>
      </div>
      <div className="project-dashboard">

        {
        project.collections.length === 0 ? (
        <>  
        <div className="templates">
          <div className="gallery new" 
          onClick={openModal}>

        <h3 className='heading'>Galleries</h3>
           <div className="thumbnails">
             <div className="thumbnail thumb1">
               <div className="backthumb bthumb1"
               ></div>
               <div className="backthumb bthumb2"></div>
               <div className="backthumb bthumb3"></div>
               <div className="backthumb bthumb4"></div>
             </div>
           </div>
           <div className="gallery-name">New Gallery</div>
           
         </div>
         </div>
        </>
      ) : (
        <>
          <div className="galleries">
            <h3 className='heading'>Galleries</h3>
            <Link className="gallery" to={`/project/galleries/${id}`}>
              <div className="thumbnails">
                <div className="thumbnail thumb1">
                  <div className="backthumb bthumb1"
                  style={
                    {
                      backgroundImage:
                        `url(${project.projectCover?project.projectCover:''})`
                    }}
                  ></div>
                  <div className="backthumb bthumb2"></div>
                  <div className="backthumb bthumb3"></div>
                </div>
                <div className="thumbnail thumb2">
                  <div className="backthumb bthumb1 count"style={
                    {
                      backgroundImage:
                        `url(${project.projectCover?project.projectCover:''})`
                    }}>
                  6 Galleries
                  </div>
                  <div className="backthumb bthumb2"></div>
                  <div className="backthumb bthumb3"></div>
                  </div>
                <div className="thumbnail thumb3">
                    <div className="backthumb bthumb1 count" style={
                    {
                      backgroundImage:
                        `url(${project.projectCover?project.projectCover:''})`
                    }}>
                    1265 Photos</div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
              </div>
          
            </Link>
            <div className="ctas">
              <div className="button secondary outline bold">+ New Gallery</div>
              <div className="button secondary outline disabled">Share</div>
            </div>
          </div>
          <div className="galleries selected">
            <h3 className='heading'>Selected</h3>
            <Link className="gallery" to={`/project/galleries/${id}`}>
              <div className="thumbnails">
                <div className="thumbnail thumb1">
                  <div className="backthumb bthumb1"
                  style={
                    {
                      backgroundImage:
                        `url(${project.projectCover?project.projectCover:''})`
                    }}
                  ></div>
                  <div className="backthumb bthumb2"></div>
                  <div className="backthumb bthumb3"></div>
                </div>
                <div className="thumbnail thumb2">
                  <div className="backthumb bthumb1" style={
                    {
                      backgroundImage:
                        `url(${project.projectCover?project.projectCover:''})`
                    }}>
                  </div>
                  <div className="backthumb bthumb2"></div>
                  <div className="backthumb bthumb3"></div>
                  </div>
                <div className="thumbnail thumb3">
                    <div className="backthumb bthumb1 count" style={
                    {
                      backgroundImage:
                        `url(${project.projectCover?project.projectCover:''})`
                    }}>
                    371 Photos</div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
                <div className="thumbnail thumb3">
                    <div className="backthumb bthumb1 count" style={
                    {
                      backgroundImage:
                        `url(${project.projectCover?project.projectCover:''})`
                    }}>
                    371 Photos</div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
              </div>
          
            </Link>

            <div className="ctas">
              <div className="label">Open in</div>
              <div className="button secondary outline bold lr disabled">Lr</div>
              <div className="button secondary outline disabled">Finder</div>
            </div>
          </div>
          </>
      )}

        <div className="financials-overview">
          <div className="payments">
            <h3 className='heading'>Payments</h3>
            <div className="card">
              <div className="chart box">
                  <div className="status large">
                    <div className="signal"></div>
                  </div>
                <div className="circle green">₹120K</div>
                <p className="message">All payments are succussful.</p>
              </div>
              <div className="payments-list">
                <div className="box amount-card">₹20K</div>
                <div className="box amount-card">₹40K</div>
                <div className="box amount-card">₹60K</div>
                <div className="box amount-card">₹60K Balance</div>
                <div className="button secondary outline disable">Add Invoice</div>
              </div>
            </div>
          </div>
          <div className="payments expances">
            <h3 className='heading'>Expances</h3>
            <div className="card">
              <div className="chart box">
                  <div className="status large">
                    <div className="signal"></div>
                  </div>
                <div className="circle orange">₹76K</div>
                <p className="message">All payments are succussful.</p>
              </div>
              <div className="payments-list">
                <div className="box amount-card">₹13K</div>
                <div className="box amount-card">₹18K</div>
                <div className="box amount-card">₹9K</div>
                <div className="button secondary outline">Invoice</div>
              </div>
            </div>
          </div>
        </div>

        <div className="shoots">
          <div className="headings">
            <h3 className='heading heading-shoots'>Shoots</h3>
            <h3 className='heading heading-crew'>Crew</h3>
          </div>
          
          <div className="shoot-list">
            <div className="event-container">
              <div className="shoot">
                <div className="time">
                  <div className="status large">
                    <div className="signal"></div>
                  </div>
                  <div className="date">
                    <h1>14</h1>
                    <h5>Feb</h5>
                  </div>
                  <p>10:00AM</p>
                  <p className='location'>Totonto, ON</p>
                </div>
                <div className="details">
                  <div className="team-badges">
                    <div className="badge"></div>
                    <div className="badge second"></div>
                    <div className="badge third"></div>
                  </div>
                </div>
                <div className="cta button secondary outline">Confirm</div>
              </div>
              <div className="crew">
                <div className="crew-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div>
                  <div className="avatar"></div>
                  <div className="name">Abhay Vincent</div>
                </div>
                <div className="crew-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div>
                  <div className="avatar"></div>
                  <div className="name">John Doe</div>
                </div>
                <div className="assistants">
                  <div className="assistant-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div><div className="avatar"></div></div>
                  <div className="assistant-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div><div className="avatar"></div></div>
                </div>
              </div>
            </div>

            <div className="event-container">
              <div className="shoot">
                <div className="time">
                  <div className="status large">
                    <div className="signal"></div>
                  </div>
                  <div className="date">
                    <h1>28</h1>
                    <h5>Feb</h5>
                  </div>
                  <p>8:00AM</p>
                  <p className='location'>Wasaga,ON</p>
                </div>
                <div className="details">
                  <div className="team-badges">
                    <div className="badge"></div>
                    <div className="badge second"></div>
                    <div className="badge third"></div>
                  </div>
                </div>
                <div className="cta button secondary outline">Confirm</div>
              </div>
              <div className="crew">
                <div className="crew-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div>
                  <div className="avatar"></div>
                  <div className="name">Abhay Vincent</div>
                </div>
                <div className="crew-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div>
                  <div className="avatar"></div>
                  <div className="name">John Doe</div>
                </div>
                <div className="crew-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div>
                  <div className="avatar"></div>
                  <div className="name">Jane Doe</div>
                </div>
                <div className="assistants">
                  <div className="assistant-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div><div className="avatar"></div></div>
                  <div className="assistant-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div><div className="avatar"></div></div>
                  <div className="assistant-card box">
                  <div className="status">
                    <div className="signal"></div>
                  </div><div className="avatar"></div></div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    

      <AddCollectionModal project={project} visible={modal.createCollection} onClose={closeModal} onSubmit={addCollection}  />
      {confirmDeleteProject ? <DeleteConfirmationModal onDeleteConfirm={onDeleteConfirm} onClose={onDeleteConfirmClose}/>:''}
    </main>
  )
  }
  // Line complexity 2.0 => 3.5