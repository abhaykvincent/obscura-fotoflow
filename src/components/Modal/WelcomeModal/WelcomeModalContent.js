import React from 'react';

export const welcomeScreens = [
  {
    title: <>Welcome to <span className='iconic-gradient'>Fotoflow!</span></>,
    body: (
      <>
        <p>
            <span className='mid-highlight'>Photography Workflow, Unlocked</span>. <br/>
        </p>
        <div className="visual-placeholder welcome"></div>
        <p>
            <span className='highlight'> Let's walk you through the basics. </span> 🚀
        </p>
      </>
    ),
  },
  {
    title: <>Manage your <span className='iconic-gradient'>Projects</span></>,
    body: (
      <>
        <p>
            A clear structure means <span className='highlight'>less searching, more creating.</span>
            
        </p>
        <div className="visual-placeholder organize-galleries"></div>
        <p>
          Keep your work tidy. <span className='mid-highlight'>Projects</span> are your main events, and within them, <span className='highlight'>Galleries</span> help you sort by client, event, or theme.
        </p>
      </>
    ),
  },
  {
    title: <>Your <span className='iconic-gradient'>Galleries, Smarter</span></>,
    body: (
      <>
        <p>
            Your clients get a <span className='highlight'>curated viewing experience</span>, effortlessly.

        </p>
        <div className="visual-placeholder smart-gallery"></div>
        <p>
            Now, let our AI <span className='mid-highlight'>automatically categorize</span> your photos within your galleries into <span className='highlight'>'Best', 'Good', and 'Other'</span>, saving you hours of manual sorting.

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
