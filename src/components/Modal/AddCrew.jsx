import React, { useEffect, useState } from 'react';
import { getUserByID, getUsersByRole, teams } from '../../data/teams';
import { addCrew } from '../../app/slices/projectsSlice';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../app/slices/alertSlice';

function AddCrewModal({ project,eventId, visible, onClose }) {
  const dispatch = useDispatch()
  const [crewData, setCrewData] = useState({
    role: 'photographer',
    assigne:'sam-0001',
    name: 'Sam',
    });
  const [users, setUsers] = useState(getUsersByRole(setCrewData.role));

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    //console.log(name,value)
    setCrewData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      if (name === 'role') {
        setUsers(getUsersByRole(value))
        setCrewData((prevData) => ({
          ...prevData,
          assigne: getUsersByRole(value)[0].userId || 'uu',
          name: getUsersByRole(value)[0].name || 'uu',
        }
        ));
      }
      if (name === 'assigne') {
        const user = getUserByID(value);
        setCrewData((prevData) => ({
          ...prevData,
          name: user.name,
        }
        ));
      }
  };
  const handleSubmit = () => {
    dispatch(addCrew({projectId:project.id,eventId:eventId,crewData:crewData}))
    .then((data)=>{
      console.log(data)
      debugger
      dispatch(showAlert({type:'success', message:`Event <b></b> added successfully!`}));
    })
    onClose('createEvent');
  };

  useEffect(() => {
    console.log(setCrewData)

  },[setCrewData.role])

  if (!visible) {
    return null;
  }

  return (
    <div className="modal-container">
      <div className="modal add-crew">
        <div className='modal-header'>
          <div className="modal-controls">
            <div className="control close" onClick={()=>onClose('addCrew')}></div>
            <div className="control minimize disabled"></div>
            <div className="control maximize disabled"></div>
          </div>
          <div className="modal-title">Add Crew</div>
        </div>
        <div className='modal-body'>
          <div className="form-section">

            {/* Role */}
            <div className="field">
              <label className="" htmlFor="">Role</label>
              <select className="" name="role" value={setCrewData.role} onChange={handleInputChange}>
                <option value="photographer">Photographer</option>
                <option value="videographer">Videographer</option>
                <option value="assistant">Assistant</option>
                <option value="designer">Designer</option>
              </select>
            </div>

            {/* Assigne */}
            <div className="field assigne">
              <label className="" htmlFor="assigne">Assigne</label>
              <div className="select-wrapper">
                <select className="" name="assigne" value={setCrewData.assigne} onChange={handleInputChange}>
                  { 
                    users.map((user)=>{
                      //console.log(user)
                      return <option key={user.userId} value={user.userId}> {user.name} </option>
                    })
                  }
                </select>
                <div className="button tertiary l2">+ New</div>
              </div>
            </div>
            {/* Template Field */}
            {/* <div className="field">
              <label className="" htmlFor="">Date</label>
              <input type="text" className="" name="date" value={EventData.date} onChange={handleInputChange}/>
            </div> */}

          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={()=>onClose('addCrew')}>Cancel</div>
          <div className="button primary" onClick={handleSubmit}>Create</div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={()=>onClose('addCrew')}></div>
    </div>
  );
}

export default AddCrewModal
// Line Complexity  1.0 -> 