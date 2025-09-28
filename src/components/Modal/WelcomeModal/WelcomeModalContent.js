import React from 'react';

export const welcomeScreens = [
  {
    title: <>Welcome to <span className='iconic-gradient'>Fotoflow!</span></>,
    body: (
      <>
        <p>
            <span className='mid-highlight'>Simplify</span> your <span className='highlight'>Workflow.</span> <span className='mid-highlight'>Elevate</span> the <span className='highlight'>Client experience</span>. <br/>
        </p>
        <div className="visual-placeholder welcome"></div>
        <p>
            <span className='highlight'> Let's walk you through the basics. </span> 🚀
        </p>
      </>
    ),
  },
  {
    title: <>Introducing <span className='iconic-gradient'>Smart Galleries</span></>,
    body: (
      <>
        <p>
            Let our AI <span className='mid-highlight'>automatically categorize</span> your photos into <span className='highlight'>'Best', 'Good', and 'Other'</span>, saving you hours of manual sorting.
        </p>
        <div className="visual-placeholder smart-gallery"></div>
        <p>
            Your clients get a <span className='highlight'>curated viewing experience</span>, effortlessly.
        </p>
      </>
    ),
  },
  {
    title: <>Create your <span className='iconic-gradient'>First Project</span></>,
    body: (
      <>
        <p>
            You're all set to begin.
        </p>
        <div className="visual-placeholder create-project"></div>
        <p>
            <span className='highlight'> Let's get started. </span> 🎉
        </p>
      </>
    ),
  },
];
