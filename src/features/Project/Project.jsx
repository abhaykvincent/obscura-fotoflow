import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AddCollectionModal from '../../components/Modal/AddCollection';
import DeleteConfirmationModal from '../../components/Modal/DeleteProject';
import DashboardEvents from '../../components/Events/Events';
import AmountCard from '../../components/Cards/AmountCard/AmountCard';
import Refresh from '../../components/Refresh/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { deleteProject, selectProjects } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { closeModal, openModal, selectModal } from '../../app/slices/modalSlice';
import AddPaymentModal from '../../components/Modal/AddPayment';
import AddBudgetModal from '../../components/Modal/AddBudget';
import { formatDecimalK, formatDecimalRs } from '../../utils/stringUtils';
import AddExpenseModal from '../../components/Modal/AddExpense';

export default function Project() {
  let { id} = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects)
  const {confirmDeleteProject} = useSelector(selectModal)
  const onDeleteConfirm = () => {
    dispatch(deleteProject(id)).then(() => {
      navigate('/projects');
      dispatch(closeModal('confirmDeleteProject'))
      dispatch(showAlert({type:'success-negative', message:`Project <b>${project.name}</b> deleted successfully!`}));// Redirect to /projects page
    })
  };

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
    <>
      <main className='project-page'>
        <div className="project-dashboard">
        {
          project.collections.length === 0 ? (
          <>  
            <div className="templates">
              <div className="gallery new" 
              onClick={()=>dispatch(openModal('createCollection'))}>
                <div className="heading-section">

            <h3 className='heading'>Galleries <span>{project.collections.length}</span></h3>
                </div>
              <div className="thumbnails">
                <div className="thumbnail thumb1">
                  <div className="backthumb bthumb1"
                  >
              <div className="button primary outline">New Gallery</div></div>
                  <div className="backthumb bthumb2"></div>
                  <div className="backthumb bthumb3"></div>
                  <div className="backthumb bthumb4"></div>
                </div>
              </div>
              
            </div>
            </div>
          </>
        ) : (
          <div className="gallery-overview">
            <div className="galleries">
              <div className="heading-shoots heading-section">
                <h3 className='heading '>Galleries <span>{project.collections.length}</span></h3>
                <div className="new-shoot button tertiary l2 outline"
                  onClick={ ()=>{}}>+ New
                </div>
              </div>
              <Link className={`gallery ${project.projectCover==="" && 'no-images'}`} to={`/gallery/${id}`}>
                <div className="thumbnails">
                  <div className="thumbnail thumb1">
                    <div className="backthumb bthumb1"
                    style={
                      {
                        backgroundImage:
                        `url(${project.projectCover!==""?project.projectCover:'https://img.icons8.com/external-others-abderraouf-omara/64/FFFFFF/external-images-photography-and-equipements-others-abderraouf-omara.png'})`
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
                    }}></div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
                  <div className="thumbnail thumb3">
                    <div className="backthumb bthumb1 count" style={
                    {
                      backgroundImage:
                        `url(${project.projectCover?project.projectCover:''})`
                    }}>
                    
                    {project.uploadedFilesCount!==0? project.uploadedFilesCount+' Photos': 'Upload Photos'}</div>
                    <div className="backthumb bthumb2"></div>
                    <div className="backthumb bthumb3"></div>
                  </div>
                </div>
              </Link>
              <div className="ctas">
                <div className="button secondary outline bold pin" onClick={()=>{
                  navigator.clipboard.writeText(`${project.pin}`)
                  showAlert('success', 'Pin copied to clipboard!')
                }}>PIN: {project.pin}</div>
                <div className="button secondary outline disabled">Share</div>
              </div>
            </div>
          </div>
        )}

          <div className="financials-overview">
            <div className="payments">
              <div className="heading-shoots heading-section">
                <h3 className='heading '>Invoices <span>{project.payments?project.payments.length:''}</span></h3>
                {project.payments?.length>0&&<div className="new-shoot button tertiary l2 outline"
                  onClick={()=>project.budgets && dispatch(openModal('addPayment'))}
                  >+ New</div>}
              </div>
              <div className={`card ${project.budgets ? '':'single'}`}>
                <div className={`chart box `}>
                    <div className="status large">
                      <div className="signal"></div>
                    </div>
                    <div className={`circle ${ !project.budgets?'gray':'green'}`}>
                    {
                      project.budgets && (
                        <>
                        {formatDecimalK(project.budgets.amount)}
                        <p className="edit text">Edit</p>
                        </>
                      )
                      
                    } 
                    </div>
                  <div className="message">

                  {
                      project.budgets || project.budgets?.amount !==0? (
                        <div className="button primary outline"
                        onClick={()=>dispatch(openModal('addBudget'))}
                        >
                          Set Budget
                        </div>
                      ) :
                      (
                        project.payments?.length === 0 &&
                        <p>Create your first invoice</p>
                      )
                    }
                  </div>
                </div>
                {project.budgets&&<div className="payments-list">
                  {
                    project.payments?.length === 0? (
                      <div className="no-payments">
                        <div className="button secondary outline"
                        onClick={()=>project.budgets && dispatch(openModal('addPayment'))}>Add Invoice</div>
                      </div>
                    ) : (
                      <>
                      {
                      project.payments?.map((payment, index) => (
                        <AmountCard amount={`₹${payment.amount/1000} K`} 
                        project={project}
                          direction="+ " 
                          percentage={
                            payment.amount/(project.budgets.amount?project.budgets.amount*100:0)
                          } 
                            status={'confirmed'}/>
                      ))}
                      {/* Balance */}
                      {
                        (
                          <AmountCard amount={
                            `₹${(project.budgets.amount - project.payments?.reduce((a,b)=>a+b.amount,0))/1000} K`
                          } direction="- " percentage={'Balance'} status={'pending'}/>
                        )
                      }
                      {/* Filler Cards */}
                      {
                        project.payments?.length<5 && (
                          Array(4-project.payments.length).fill(0).map((item, index) => (
                            <AmountCard amount={''} direction={''} percentage={''} status={'draft'}/>
                          ))
                        )
                      }
                      </>
                    )
                  }
                </div>}
              </div>
            </div>
            {/* expenses */}
            <div className="payments expenses">
            <div className="heading-shoots heading-section">
                <h3 className='heading '>Expenses <span>{project.expenses?.length}</span></h3>
                {project.expenses?.length>0&&<div className="new-shoot button tertiary l2 outline"
                  onClick={()=>project.expenses && dispatch(openModal('addExpense'))}
                  >+ New</div>}
              </div>
              <div className={`card ${project.expenses ? '':'single'}`}>
                <div className={`chart box `}>
                    <div className="status large">
                      <div className="signal"></div>
                    </div>
                    <div className={`circle ${ !project.budgets?.length>0?'gray':'green'}`}>
                     
                    </div>
                  <div className="message">

                  {
                      project.expenses || project.expenses?.amount !==0? (
                        <div className="button primary outline"
                        onClick={()=>dispatch(openModal('addExpense'))}
                        >
                          Add Expense
                        </div>
                      ) :
                      (
                        project.expenses?.length === 0 &&
                        <p>Add project expenses</p>
                      )
                    }
                  </div>
                </div>
                {project.expenses&&project.expenses[0]?.amount&&<div className="payments-list">
                  {
                    project.expenses?.length === 0? (
                      <div className="no-payments">
                        <div className="button secondary outline"
                        onClick={()=>project.budgets && dispatch(openModal('addExpense'))}>Add Expense</div>
                      </div>
                    ) : (
                      <>
                      {
                      project.expenses?.map((payment, index) => (
                        <AmountCard amount={`₹ ${payment.amount/1000}K`} 
                        project={project}
                          direction="+ " 
                          percentage={payment.name} 
                            status={'confirmed'}/>
                      ))}
                      {/* Filler Cards */}
                      {
                        project.expenses?.length<5 && (
                          Array(5-project.expenses.length).fill(0).map((item, index) => (
                            <AmountCard amount={''} direction={''} percentage={''} status={'draft'}/>
                          ))
                        )
                      }
                      </>
                    )
                  }
                </div>}
              </div>
            </div>
          </div>

          <DashboardEvents project={project} />

        </div>
        <AddCollectionModal project={project}/>
        <AddPaymentModal  project={project}/>
        <AddExpenseModal  project={project}/>
        <AddBudgetModal  project={project}/>
        {confirmDeleteProject ? <DeleteConfirmationModal onDeleteConfirm={onDeleteConfirm}/>:''}
        <Refresh/>
      </main>
      <div className="project-info">
        <div className="breadcrumbs">
          <Link className="back" to="/projects">Projects</Link>
        </div>
        <div className="client">
          <h1>{project.name}</h1>
          <div className="type">{project.type}</div>
        </div>
        <div className="project-options">
          <div className="button tertiary" onClick={()=>{
            dispatch(openModal('confirmDeleteProject'))
          }}>Delete</div>
        </div>
      </div>
    </>
  )
  }
  // Line complexity 2.0 -> 3.5 -> 2.0 ->2.5