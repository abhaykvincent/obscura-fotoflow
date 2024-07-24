import {Link} from 'react-router-dom';
import './AssociateCard.scss'

function AssociateCard({associate}) {   
    //associate's selected photos count
  return (
    <Link className={`associate ${associate.id} ${associate.type?associate.type:''} `} to={`/associate/${associate.id}`} key={associate.id}>
        <div className="cover-wrap">
            <div
                className="associate-cover"
                style={{
                    backgroundImage: associate.associateCover ? `url(${associate.associateCover})` : '',
                    backgroundSize: associate.associateCover ? 'cover' : '',
                }}
            />
        </div>
        <div className="associate-details">
            <div className="details-top">
                <div className="left">
                    <h4 className="associate-title">{associate.name}</h4>
                    <p className="associate-type">{associate.type}</p>
            
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
