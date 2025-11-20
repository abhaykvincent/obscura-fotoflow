import React from 'react';

const UserDetails = ({
  userData,
  errors,
  handleInputChange,
  nameInputRef,
  emailInputRef,
  passwordInputRef,
  studioNameInputRef,
  domainInputRef,
  phoneInputRef
}) => {
  return (
    <div className="form-section user-details">
      <div className="field">
        <label>Name</label>
        <input
          name="displayName"
          ref={nameInputRef}
          value={userData.displayName}
          placeholder="e.g. John Doe"
          type="text"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && userData.displayName.trim()) {
              e.preventDefault();
              emailInputRef.current?.focus();
            }
          }}
        />
        <span></span>
        {errors.displayName && <div className="error">{errors.displayName}</div>}
      </div>
      <div className="field">
        <label>Email</label>
        <input
          name="email"
          ref={emailInputRef}
          value={userData.email}
          placeholder="e.g. john.doe@example.com"
          type="email"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && userData.email.trim()) {
              e.preventDefault();
              passwordInputRef.current?.focus();
            }
          }}
        />
        <span></span>
        {errors.email && <div className="error">{errors.email}</div>}
      </div>
      <div className="field">
        <label>Studio Name</label>
        <input
          name="studioName"
          ref={studioNameInputRef}
          value={userData.studioName}
          placeholder="Enter a strong password"
          type="text"
          onChange={handleInputChange}
        />
        <span></span>
        {errors.studioName && <div className="error">{errors.studioName}</div>}
      </div>
      <div className="field">
        <label>Domain</label>
        <input
          name="domain"
          ref={domainInputRef}
          value={userData.domain}
          placeholder="domain"
          type="text"
          onChange={handleInputChange}
        />
        <span></span>
        {errors.domain && <div className="error">{errors.domain}</div>}
      </div>
      <div className="field">
        <label>Phone</label>
        <input
          name="phone"
          ref={phoneInputRef}
          value={userData.phone}
          placeholder="phone"
          type="text"
          onChange={handleInputChange}
        />
        <span></span>
        {errors.phone && <div className="error">{errors.phone}</div>}
      </div>
      <div className="field">
        <label>Role</label>
        <select name="role" value={userData.role} onChange={handleInputChange}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="studio-admin">Studio Admin</option>
        </select>
        <span></span>
        {errors.role && <div className="error">{errors.role}</div>}
      </div>
    </div>
  );
};

export default UserDetails;
