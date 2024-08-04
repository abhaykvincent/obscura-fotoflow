import React from 'react'
import './Storage.scss'
import StoragePie from '../../components/StoragePie/StoragePie';
import { convertMegabytes } from '../../utils/stringUtils';
import { selectProjects } from '../../app/slices/projectsSlice';
import { useSelector } from 'react-redux';
import { getUsedSpace } from '../../utils/fileUtils';
import { selectStorageLimit } from '../../app/slices/studioSlice';
import { Link } from 'react-router-dom';

function Storage() {
    const projects = useSelector(selectProjects)
    const storageLimit = useSelector(selectStorageLimit)
    // Calculate the storage used from projects importFileSize
    const usedSpace = getUsedSpace(projects)
    
    const progressPercentage = 25; // Set the desired progress percentage

  // Calculate the stroke-dashoffset based on the percentage
  const dashOffset = ((100 - progressPercentage) / 100) * (Math.PI * 2 * 70);

  return (
    <main className='storage-page'>
        <div className="page-header">
            <h1>Storage</h1>
        </div>
      <div className="storage-info">
        <div className="storage-pie-wrap">
            <StoragePie totalSpace={storageLimit.total} usedSpace={usedSpace} active={true}/>
            <StoragePie totalSpace={storageLimit.total*2} usedSpace={usedSpace} />
        </div>
        {/* <p className="storage-insight">Storing 24034 photos in 17 collections</p> */}
        <div className="storage-subscription">
            <div className="subscription-info row-group">
                <div className="row subscription-group">
                    <div className="box-content">
                        <h3>5GB/month</h3>
                        <p>Free Storage</p>
                    </div>
                    <div className="action">
                        <Link to="/${defaultStudio.domain}/subscriptions" className="button secondary large">Add More Storage</Link>
                    </div>
                </div>
                <div className="row subscription-group">
                    <div className="box-content">
                        <h3>Core</h3>
                        <p>Current Plan</p>
                    </div>
                    <div className="action">
                        <Link to="/${defaultStudio.domain}/subscriptions" className="button primary large">Upgrade</Link>

                    </div>
                </div>
            </div>
        </div>
      </div>
      <section className="breakdown storage">
        <div className="storage-class cold">

            <p className='storage-class-label'>Primary Storage <b>5GB</b></p> 
            <div className="bar">
                <div className="photos"></div>
                <div className="videos"></div>
                <div className="duplicates"></div>
            </div>
            <div className="legends">
                <div className="legend">
                    <div className="colour photos"></div>
                    <div className="label">Photos</div>
                </div>
                <div className="legend">
                    <div className="colour videos"></div>
                    <div className="label">Videos</div>
                </div>
                <div className="legend">
                    <div className="colour duplicates"></div>
                    <div className="label">Duplicates</div>
                </div>
                <div className="legend ">
                    <div className="colour available"></div>
                    <div className="label">Available</div>
                </div>
            </div>
        </div>
        <div className="storage-class cold">
            <p className='storage-class-label'>+ Cold Storage <b>10GB</b></p>
            <div className="bar">
                <div className="used"></div>
                <div className="limited access"></div>
            </div>
            <div className="legends">
                <div className="legend ">
                    <div className="colour used"></div>
                    <div className="label">Used</div>
                </div>
                <div className="legend ">
                    <div className="colour limited"></div>
                    <div className="label">Limited Access</div>
                </div>
                <div className="legend">
                    <div className="colour available"></div>
                    <div className="label">Available</div>
                </div>
            </div>
        </div>
      </section>
      <section className="breakdown projects">

      <div className="breakdown-class">
            <h2>Projects</h2>
            <div className="row-group">
                {
                    projects.map((project,index)=>{
                        return (
                            <div className="row" key={project.id}>
                                <div className="box-wrap">
                                    <div className="status-signal"></div>
                                    <div className="box-content">
                                        <h4>{project.name}</h4>
                                        <div className="project-size">
                                            <p>{convertMegabytes(project.totalFileSize,1)} </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="action">
                                    <div className="button secondary">Manage</div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
        <div className="breakdown-class cold">
            <h2>Cold Storage</h2>
            <div className="row-group">
                {
                    projects.slice(0, 3).map((project) => {
                        return (
                            
                            <div className="row" key={project.id}>
                                <div className="box-wrap">
                                    <div className="status-signal"></div>
                                    <div className="box-content">
                                        <h4>{project.name}</h4>
                                        <div className="project-size">
                                            <p>{convertMegabytes(project.totalFileSize,1)} </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="action">
                                    <div className="button secondary">Manage</div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
      </section>
    </main>
  )
}

export default Storage