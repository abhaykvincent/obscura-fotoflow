import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAlert } from "../../app/slices/alertSlice";
import { useNavigate } from "react-router";
import { closeModalWithAnimation, selectModal } from "../../app/slices/modalSlice";
import { selectUserStudio } from "../../app/slices/authSlice";
import { useModalFocus } from "../../hooks/modalInputFocus";
import { generateReferral } from "../../app/slices/referralsSlice";

const initialReferralData = {
  campainName: "",
  name: "",
  studioName: "",
  type: "direct",
  email: "",
  studioContact: "",
  code: [],
  status: "active",
  quota: 3,
  used: 0,
  validity: 30,
  createdAt: new Date().toISOString(),
};

export default function AddReferralModal({}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visible = useSelector(selectModal);
  const currentStudio = useSelector(selectUserStudio);

  const [selectedTab, setSelectedTab] = useState("DIRECT");
  const [referralData, setReferralData] = useState(initialReferralData);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);

  useEffect(() => {
    setReferralData({
      ...initialReferralData,
      type: selectedTab.toLowerCase(),
      campainName: "",
      name: "",
      studioName: "",
      email: "",
      studioContact: "",
    });
  }, [selectedTab]);

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

  const onClose = () => dispatch(closeModalWithAnimation("addReferral"));

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setReferralData((prevData) => {
      const newData = { ...prevData, [name]: value };
      if (name === "name" && selectedTab === "DIRECT" && !isCodeManuallyEdited) {
        const generatedCode = value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 12);
        newData.code = generatedCode ? [generatedCode] : [];
      }
      return newData;
    });
  };


  const handleCodeChange = (event) => {
    setIsCodeManuallyEdited(true);
    const { value } = event.target;
    setReferralData((prevData) => ({
      ...prevData,
      code: value ? [value.trim()] : [],
    }));
  };

  const handleSubmit = () => {
    onClose();
    setTimeout(() => {
      dispatch(generateReferral(referralData))
        .then(() => {
          dispatch(
            showAlert({
              type: "success",
              message: "Referral created successfully!",
            })
          );
        })
        .catch((error) => {
          console.error("Error creating Referral:", error);
          dispatch(
            showAlert({ type: "error", message: "Failed to create referral." })
          );
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
            <div className="view-control">
              <div className="filter-controls">
                <div className="control-wrap">
                  <div className="controls">
                    <div
                      className={`control ${
                        selectedTab === "DIRECT" ? "active" : ""
                      }`}
                      onClick={() => handleTabClick("DIRECT")}
                      role="button"
                      tabIndex={0}
                    >
                      Direct
                    </div>
                    <div
                      className={`control ${
                        selectedTab === "CAMPAIGN" ? "active" : ""
                      }`}
                      onClick={() => handleTabClick("CAMPAIGN")}
                      role="button"
                      tabIndex={0}
                    >
                      Campaign
                    </div>
                  </div>
                  <div className="label">Referral Type</div>
                </div>
              </div>
            </div>

            {selectedTab === "DIRECT" && (
              <>
                <div className="field">
                  <label>Name</label>
                  <input
                    name="name"
                    value={referralData.name}
                    type="text"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="field">
                  <label>Studio</label>
                  <input
                    name="studioName"
                    value={referralData.studioName}
                    type="text"
                    onChange={handleInputChange}
                  />
                </div>
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
                  <label>Custom Code</label>
                  <input
                    name="code"
                    value={referralData.code[0] || ""}
                    type="text"
                    placeholder="e.g. SUMMER25"
                    onChange={handleCodeChange}
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
                    name="studioContact"
                    value={referralData.studioContact}
                    type="text"
                    placeholder="8888 888 888"
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}

            {selectedTab === "CAMPAIGN" && (
              <>
                <div className="field">
                  <label>Campaign</label>
                  <input
                    name="campainName"
                    value={referralData.campainName}
                    type="text"
                    onChange={handleInputChange}
                  />
                </div>
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
                  <label>Custom Code</label>
                  <input
                    name="code"
                    value={referralData.code[0] || ""}
                    type="text"
                    placeholder="e.g. SUMMER25"
                    onChange={handleCodeChange}
                  />
                </div>
              </>
            )}
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
