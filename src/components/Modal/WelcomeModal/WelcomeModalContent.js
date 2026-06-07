import React from 'react';

export const welcomeScreens = [
  {
    title: <>Welcome to <span className='iconic-gradient'>Fotoflow</span>!</>,
    body: (
      <>
        <p>
            <span className='mid-highlight'>Streamline Event photography Workflow</span>. <br/>
        </p>
        <div className="visual-placeholder welcome"></div>
        <p>
            <span className='highlight'> Let's walk you through core features. </span> 🚀
        </p>
      </>
    ),
  },
  {
    title: <>Manage your <span className='iconic-gradient'>Projects</span>.</>,
    body: (
      <>
        <p>
            A clear structure means <span className='highlight'>less searching, more creating.</span>
            
        </p>
        <div className="visual-placeholder organize-projects"></div>
        <p>
          Keep your work tidy. <span className='mid-highlight'>Projects</span> are your main events, and within them, <span className='highlight'>Galleries</span> help you sort by client, event, or theme.
        </p>
      </>
    ),
  },
  {
    title: <>Share your <span className='iconic-gradient'>Galleries</span>.</>,
    body: (
      <>
        <p>
            Your clients get a <span className='highlight'>curated viewing experience</span>, effortlessly.

        </p>
        <div className="visual-placeholder smart-gallery"></div>
        <p>
            Now, let our <span className='highlight'>Gallery Designer</span> helps you complete the professional look your brand deserves in <span className='mid-highlight'>Minutes</span>, saving you hours.

        </p>
      </>
    ),
  },
  {
    /* 3RD POSITION: SELECTION & COLLABORATION */
    title: <>Collaborate on <span className='iconic-gradient'>Selections</span>.</>,
    body: (
      <>
        <p>
            Forget the hassle of <span className='highlight'>mailing or</span> and the headache of <span className='highlight'>hunting for filenames.</span>
        </p>
        <div className="visual-placeholder collaboration-selection"></div>
        <p>
            When clients <span className='highlight'>Select </span> their favorites, Fotoflow lets you <span className='mid-highlight'>instantly <span className='highlight'>locate </span> locate the original files</span> on your <span className='highlight'>computer </span>  for final editing.
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
        <p className='create-project-tagline'>
            🎉 <span className='highlight'> Let's get started. </span> 
        </p>
      </>
    ),
  },
];
