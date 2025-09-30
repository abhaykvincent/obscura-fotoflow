import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../app/slices/alertSlice";
import { addProject, createSubProject } from "../../app/slices/projectsSlice";
import { useNavigate } from "react-router";
import { closeModalWithAnimation, selectModal } from "../../app/slices/modalSlice";
import { selectUserStudio } from "../../app/slices/authSlice";
import { useModalFocus } from "../../hooks/modalInputFocus";
import { generateReferral } from "../../app/slices/referralsSlice";

export default function AddReferralModal({ }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visible = useSelector(selectModal);
  const currentStudio = useSelector(selectUserStudio);

  const onClose = () => dispatch(closeModalWithAnimation("addReferral"));

  const [referralData, setReferralData] = useState({
    campainName: "",
    campainPlatform: "whatsapp",
    type: "referral",
    email: "",
    phoneNumber: "",
    code: [],
    status: "active",
    quota: 3,
    used: 0,
    validity: 30,
    createdAt: new Date().toISOString(),
  });
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setReferralData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    const domain = currentStudio.domain;
    onClose();
    setTimeout(() => {
        // Create Normal Project
        dispatch(generateReferral(referralData ))
          .then((response) => {
            dispatch(showAlert({ type: "success", message: "Referral created successfully!" }));
            /* navigate(`/${domain}/project/${id}`); */
          })
          .catch((error) => {
            console.error("Error creating Referral:", error);
            dispatch(showAlert({ type: "error", message: "Failed to create referral." }));
          });
    }, 500);
  };

  const modalRef = useModalFocus(visible.addReferral);

  if (!visible.addReferral) {
    return null;
  }

  return (
    <div className="modal-container" ref={modalRef}>
      <div className="modal create-project island">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">{"Generate Referral"}</div>
        </div>
        <div className="modal-body">
          <div className="form-section">

          {/* Campain Name */}          
          <div className="field">
            <label>Name</label>
            <input
            name="name"
            value={referralData.name}
            type="text"
            onChange={handleInputChange}
            />
          </div>
          {/* Campain Name */}          
          <div className="field">
            <label>Campain name</label>
            <input
            name="campainName"
            value={referralData.campainName}
            type="text"
            onChange={handleInputChange}
            />
          </div>
          {/* Studio Name */}          
          <div className="field">
            <label>Studio Name</label>
            <input
            name="studioName"
            value={referralData.studioName}
            type="text"
            onChange={handleInputChange}
            />
          </div>


          {/* Campain Platform */}
          <div className="field">
              <label>Campain Platform</label>
              <select
              name="campainPlatform"
              value={referralData.campainPlatform}
              onChange={handleInputChange}
              >
                  <option value="">Select a platform</option>
                  <option value="direct">Direct</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
              </select>
          </div>

          {/* Type*/}
          <div className="field">
              <label>Type</label>
              <select
              name="type"
              value={referralData.type}
              onChange={handleInputChange}
              >
                  <option value="">Select a type</option>
                  <option value="referral">Referral</option>
                  <option value="promo">Promo</option>
                  <option value="discount">Discount</option>
                  <option value="tester">Tester</option>
                  <option value="tester">Internal</option>
              </select>
          </div>
                    
          {/* Campain Name */}          
          <div className="field">
            <label>Quota</label>
            <input
            name="quota"
            value={referralData.quota}
            type="number"
            onChange={handleInputChange}
            />
          </div>

            <div className="field optional">
                <label>Email</label>
                <input
                name="email"
                value={referralData.email}
                type="text"
                onChange={handleInputChange}
                />
            </div>
            <div className="field ">
                <label>Phone Number +91</label>
                <input
                name="phoneNumber"
                value={referralData.phoneNumber}
                type="text"
                placeholder="8888 888 888"
                onChange={handleInputChange}
                />
            </div>
                
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>
            Cancel
          </div>
          <div className="button primary" onClick={handleSubmit}>
            {"Generate Referral"}
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
