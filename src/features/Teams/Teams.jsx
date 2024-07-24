import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import React Router components
import AddProjectModal from '../../components/Modal/AddProject';
import './Teams.scss';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import Refresh from '../../components/Refresh/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';
import AssociateCard from '../../components/Teams/AssociatetCard/AssociatetCard';
import { selectTeams } from '../../app/slices/teamsSlice';

function Teams() {
    const dispatch = useDispatch()
    const teams = useSelector(selectTeams)
    useEffect(() => {
      console.log(teams)
    }, [teams]);
    return (
        <main className="teams">
            <div className="teams-header">
                <h1>Teams</h1>
                <div className="actions">
                    <div className="button primary icon add"
                        onClick={()=>dispatch(openModal('createAssociate'))}
                    >New Associate</div>
                </div>
            </div>
            <div className="view-control">
                <div className="control-wrap">
                    <div className="controls">
                        <div className={`control ctrl-all active`} >All</div>
                        <div className={`control ctrl-active`} >Upcoming</div>
                        <div className={`control ctrl-pending`} >In Progres</div>
                        <div className={`control ctrl-draft`} >Completed</div>
                        <div className={`control ctrl-draft`} >Archived</div>
                    </div>
                    <div className={`active`}></div>
                </div>
                <div className="control-wrap">
                    <div className="controls">
                        <div className={`control ctrl-all active`} ><div className="icon card-view"></div></div>
                        <div className={`control ctrl-active disabled`} ><div className="icon list-view"></div></div>
                    </div>
                    <div className={`active`}></div>
                </div>
            </div>
            <div className="teams-list">
                { 
                teams.length !== 0? (
                  teams.map((associate, index) => (
                        <AssociateCard
                        associate={associate}
                        key={associate.id}
                    /> 
                    ))) : (
                        <>
                            <div className="section recent">
                                <h3 className='section-heading'>Recent Projects</h3>
                            </div>

                            <div className="associate new"
                                onClick={()=>{dispatch(openModal('createProject'))}}
                            >
                                <div className="associate-cover" ></div>
                                <div className="associate-details">
                                    <div className="details-top">

                                        <h4 className="associate-title">Create Your First Project</h4>
                                        <p className="associate-type"></p>
                                    </div>
                                </div>
                                <div className="associate-options"></div>
                            </div>
                        </>
                    )
                }
            </div>
            {/* Refresh Projects Data from cloud */}
            <Refresh/>
            
        </main>
    );
}

export default Teams;
// Line Complexity  1.0 -> 