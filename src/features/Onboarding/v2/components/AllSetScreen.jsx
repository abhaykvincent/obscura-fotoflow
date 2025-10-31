import React from 'react';

const AllSetScreen = ({ onPrevious }) => {

    return (
        <div className={`screen all-set animate-reveal`}>
            <div className="screen-title">
                <div className="back-form" onClick={onPrevious}></div>
                <h2 className=''>You are all set!</h2>
            </div>
            <p className='section-intro'>Click "Open App" to complete your studio setup and start exploring FotoFlow.</p>
        </div>
    );
};

export default AllSetScreen;