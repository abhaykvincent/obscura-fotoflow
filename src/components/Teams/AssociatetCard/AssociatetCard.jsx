import {Link} from 'react-router-dom';
import './AssociateCard.scss'
import { capitalizeFirstLetter } from '../../../utils/stringUtils';

function AssociateCard({associate}) {   
    //associate's selected photos count
  return (
    <Link className={`associate ${associate.userId} ${associate.type?associate.type:''} `} to={`/associate/${associate.id}`} key={associate.id}>
        <div className="cover-wrap">
            <div
                className={`associate-cover avatar ${associate.userId}`} 
                style={{
                    backgroundImage: associate.associateCover ? `url(${associate.associateCover})` : '',
                    backgroundSize: associate.associateCover ? 'cover' : '',
                }}
            />
        </div>
        <div className="associate-details">
            <div className="details-top">
                <div className="left">
                    <div className="card-title">
                        <h2 className="associate-title">{associate.name}</h2>
                        <p className='access-level'>{capitalizeFirstLetter(associate.projectAccess.accessLevel)}</p>
                    </div>
                    <div className="roles">
                        {
                            associate.projectAccess.roles.map((role,index)=>{
                                return <p className="associate-type">{capitalizeFirstLetter(role)}</p>
                            })

                        }
                    </div>
                    <div className="card-email">
                        <div className="icon email"></div>
                        <p className="associate-email">{associate.email}</p>
                    </div>
                    <div className="card-phone">
                        <div className="icon phone"></div>
                        <p className="associate-phone">+91 9999-999999</p>
                    </div>
            
                </div>
                <div className="right">
                    <div className="status-signal"></div>
                </div>
            </div>
        </div>
        
    </Link>
    );
}

    export default AssociateCard;
