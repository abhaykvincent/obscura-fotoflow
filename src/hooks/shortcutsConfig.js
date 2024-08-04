import { useNavigate } from 'react-router-dom';

// Replace this with your default studio
const defaultStudio = 'obscura';

export const useShortcutsConfig = () => {
  const navigate = useNavigate();

  const handlers = {
    OPEN_PROJECTS: () => {
      console.log('Opening Projects Page...');
      navigate(`/${defaultStudio}/projects`);
    },
    OPEN_HOME: () => {
      console.log('Opening Home Page...');
      navigate(`/${defaultStudio}/`);
    },
    OPEN_STORAGE: () => {
      console.log('Opening Storage Page...');
      navigate(`/${defaultStudio}/storage`);
    },
    OPEN_NOTIFICATIONS: () => {
      console.log('Opening Notifications Page...');
      navigate(`/${defaultStudio}/notifications`);
    },
    OPEN_SUBSCRIPTION: () => {
      console.log('Opening Subscription Page...');
      navigate(`/${defaultStudio}/subscription`);
    },
    OPEN_STORE: () => {
      console.log('Opening Store Page...');
      navigate(`/${defaultStudio}/store`);
    },
    OPEN_CALENDAR: () => {
      console.log('Opening Calendar Page...');
      navigate(`/${defaultStudio}/calendar`);
    },
    OPEN_INVOICES: () => {
      console.log('Opening Invoices Page...');
      navigate(`/${defaultStudio}/invoices`);
    },
    OPEN_ACCOUNTS: () => {
      console.log('Opening Accounts Page...');
      navigate(`/${defaultStudio}/accounts`);
    },
    OPEN_TEAM: () => {
      console.log('Opening Team Page...');
      navigate(`/${defaultStudio}/team`);
    },
    // Add more handlers as needed
  };

  const keyMap = {
    OPEN_PROJECTS: 'alt+p',
    OPEN_HOME: 'alt+h',
    OPEN_STORAGE: 'alt+o',
    OPEN_NOTIFICATIONS: 'alt+n',
    OPEN_SUBSCRIPTION: 'alt+u',
    OPEN_STORE: 'alt+t',
    OPEN_CALENDAR: 'alt+c',
    OPEN_INVOICES: 'alt+i',
    OPEN_ACCOUNTS: 'alt+a',
    OPEN_TEAM: 'alt+m',
    // Add more key mappings as needed
  };

  return { keyMap, handlers };
};
