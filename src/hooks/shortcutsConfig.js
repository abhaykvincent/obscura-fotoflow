import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUserStudio } from '../app/slices/authSlice';


export const useShortcutsConfig = () => {
  const defaultStudio = useSelector(selectUserStudio)

  const navigate = useNavigate();

  const handlers = {
    OPEN_PROJECTS: () => {
      console.log('Opening Projects Page...');
      navigate(`/${defaultStudio.domain}/projects`);
    },
    OPEN_HOME: () => {
      console.log('Opening Home Page...');
      navigate(`/${defaultStudio.domain}/`);
    },
    OPEN_STORAGE: () => {
      console.log('Opening Storage Page...');
      navigate(`/${defaultStudio.domain}/storage`);
    },
    OPEN_NOTIFICATIONS: () => {
      console.log('Opening Notifications Page...');
      navigate(`/${defaultStudio.domain}/notifications`);
    },
    OPEN_SUBSCRIPTION: () => {
      console.log('Opening Subscription Page...');
      navigate(`/${defaultStudio.domain}/subscription`);
    },
    OPEN_STORE: () => {
      console.log('Opening Store Page...');
      navigate(`/${defaultStudio.domain}/store`);
    },
    OPEN_CALENDAR: () => {
      console.log('Opening Calendar Page...');
      navigate(`/${defaultStudio.domain}/calendar`);
    },
    OPEN_INVOICES: () => {
      console.log('Opening Invoices Page...');
      navigate(`/${defaultStudio.domain}/invoices`);
    },
    OPEN_ACCOUNTS: () => {
      console.log('Opening Accounts Page...');
      navigate(`/${defaultStudio.domain}/accounts`);
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
