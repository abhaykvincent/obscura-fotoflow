import React from 'react';
import { CalendarOff, Mail, Globe, Instagram, Facebook, Phone } from 'lucide-react';
import { toTitleCase } from '../../utils/stringUtils';
import './ProjectExpiredPage.scss';

const ProjectExpiredPage = ({ project, studio, studioName }) => {
  const tagline = studio?.gallery?.galleryTagline || `Smile with ${studio?.name || studioName}`;

  const contactLinks = [
    { 
      icon: <Globe size={20} />, 
      label: 'Website', 
      value: studio?.website,
      href: studio?.website?.startsWith('http') ? studio.website : `https://${studio?.website}`
    },
    { 
      icon: <Instagram size={20} />, 
      label: 'Instagram', 
      value: studio?.social?.instagram,
      href: `https://instagram.com/${studio?.social?.instagram}`
    },
    { 
      icon: <Facebook size={20} />, 
      label: 'Facebook', 
      value: studio?.social?.facebook,
      href: `https://facebook.com/${studio?.social?.facebook}`
    },
    { 
      icon: <Mail size={20} />, 
      label: 'Email', 
      value: studio?.email,
      href: `mailto:${studio?.email}`
    },
    { 
      icon: <Phone size={20} />, 
      label: 'Phone', 
      value: studio?.phone,
      href: `tel:${studio?.phone}`
    }
  ].filter(link => link.value);

  return (
    <div className="project-expired-page">
      <div className="expired-content">
        <div className="expired-icon-container">
          <CalendarOff size={64} strokeWidth={1.5} />
        </div>
        
        <h1 className="expired-title">Gallery Expired</h1>
        <p className="expired-message">
          The gallery for <strong>{toTitleCase(project?.name || 'this project')}</strong> has reached its storage limit and is no longer public.
        </p>

        <div className="cta-container">
          <p className="cta-text">
            Want to keep these memories forever? Contact the photographer to extend the storage for years or to own the gallery permanently.
          </p>
          
          <div className="studio-info">
            {studio?.studioLogo && (
              <img 
                src={studio.studioLogo} 
                alt={`${studio.name} logo`} 
                className="studio-logo" 
              />
            )}
            <h2 className="studio-name">{studio?.name || studioName}</h2>
            <p className="studio-tagline">{tagline}</p>
          </div>

          <div className="contact-grid">
            {contactLinks.map((link, index) => (
              <a 
                key={index} 
                href={link.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-item"
              >
                {link.icon}
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="expired-footer">
          <p>Powered by <a href="https://fotoflow.pro" target="_blank" rel="noopener noreferrer">FotoFlow Pro</a></p>
        </div>
      </div>
    </div>
  );
};

export default ProjectExpiredPage;
