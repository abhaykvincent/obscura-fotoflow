import React, { useEffect, useState } from 'react';
import './CreateStudio.scss';
import { logout } from '../../app/slices/authSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { update } from 'firebase/database';
import { checkStudioDomainAvailability } from '../../firebase/functions/firestore';
import { openModal } from '../../app/slices/modalSlice';
import PrivacyPolicy from '../PrivacyPolicy/PrivacyPolicy';

const CreateStudio = ({active,next,createAccountData,updateAccountData,user}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [studioName, setStudioName] = useState(createAccountData.studioName);
  const [studioDomain, setStudioDomain] = useState('');
  const [isDomainAvailable, setIsDomainAvailable] = useState(false);
  const [suggestSubDomains, setSuggestSubDomains] = useState(['-studio','-photography','-weddings','-media']);
  const [isSuggestionsAvailable, setIsSuggestionsAvailable] = useState(false);
  // Debounce effect: Update debouncedStudioName after 3 seconds of inactivity
  useEffect(() => {
    const handler = setTimeout(() => {
      console.log(studioName)
      if (studioName.length > 3) {
        setIsSuggestionsAvailable(false);
      }
    }, 2000);

    return () => {
      clearTimeout(handler);
    };
  }, [studioName]);

  /* useEffect(()=>{
    if(!isDomainAvailable){
      getAISubdomainSuggestions()
      .then((suggestions)=>{
        const encodedResponse = suggestions.aggregatedResponse.candidates[0].content.parts[0].text;
        console.log(encodedResponse)
        // Parse the nested JSON inside the "text" property
          const finalResponse = JSON.parse(encodedResponse);

          // Access the desired prope
        console.log(JSON.parse(finalResponse.response))
        setSuggestSubDomains(JSON.parse(finalResponse.response))
      })
      .catch((error)=>{
        console.error('Error getting AI suggestions:', error);
      })
    }
  },[isDomainAvailable]) */
  useEffect(()=>{
    // checkStudioDomainAvailability(studioDomain) async
    if(studioDomain.length>3){
      checkStudioDomainAvailability(studioDomain)
      .then((isAvailable)=>{
        setIsDomainAvailable(isAvailable)
      })
      .catch((error)=>{
        console.error(' Error checking domain availability:', error);
      })
    }
  },[studioDomain])

  useEffect(()=>{
    console.log(isDomainAvailable)
  },[isDomainAvailable])
  

  const handleStudioNameChange = (e) => {
    const name = e.target.value;
    setStudioName(name);
    setStudioDomain(name.toLowerCase().replace(/\s+/g, ''));
  };
  // Post request to the AI API
  // https://us-central1-fotoflow-cloud.cloudfunctions.net/flowai-test/generate-content
  // payload desiredSubDomain:: string;
  const getAISubdomainSuggestions = async () => {
    try {
      const response = await fetch('https://us-central1-fotoflow-cloud.cloudfunctions.net/flowai-test/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ desiredSubdomain: studioName }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      return [];
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateAccountData({studioName,studioDomain})
    next()
    // Handle studio creation logic here
    console.log('Studio Name:', studioName);
    console.log('Studio Domain:', studioDomain);
  };

  if (!active) {
    return null;
  }
  // Get the domain from the current URL the www.fotoflow.com part
  const url = window.location.href;
  const domain = url.split('/')[2];

  return (
    <>
      <div className={`screen create-studio ${user?.email && 'active'}`}>
      
        <p className='section-intro'>Let's start with the <span className="name-label">name</span> for your studio </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              id="studioName"
              value={studioName}
              placeholder='Studio name'
              onChange={handleStudioNameChange}
              autocomplete="off"
              required
            />
            <div className={
            `studio-domain-selector ${isDomainAvailable ?'available':'taken'} 
            ${studioDomain.length>3 && 'active'}`}>

              <div className="domain-input-container">
                <div className="web-icon"></div>
                <p className={`studio-domain `}>{domain}/
                    <span className={isDomainAvailable?`available`:`taken`} contentEditable>{studioDomain}

                    {!isSuggestionsAvailable &&  studioDomain.length>3 &&
                      <span className={`suggestions ${isDomainAvailable && 'focus-out'}` }>
                        {suggestSubDomains.map((subdomain, index) => (
                          <span key={index} className='suggestion' onClick={()=>{
                            setStudioDomain(studioDomain+subdomain)}
                          }>{studioDomain}{subdomain}</span>
                        ))}
                      </span>
                  }
                    </span>
                      
                </p>
              </div>
              
              {
                studioDomain.length>3 &&
                (isDomainAvailable ?
                  <p className='input-reaction subdomain-available'>{`Sub-domain Available`}</p>:
                  <p className='input-reaction'>{`Sub-domain already taken. `}</p>)
              }
            </div>
            
          </div>
          <div className={`button primary large ${!isDomainAvailable ? 'disabled':''}`}
            onClick={handleSubmit}
          >Create Studio</div>
        </form>
      </div>
    </>

  );
};

export default CreateStudio;
