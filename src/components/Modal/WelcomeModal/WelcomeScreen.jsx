import React from 'react';

const WelcomeScreen = ({ title, body }) => {
  return (
    <div className="welcome-screen-body-wrapper">
      <h2>{title}</h2>
      {body}
    </div>
  );
};

export default WelcomeScreen;
