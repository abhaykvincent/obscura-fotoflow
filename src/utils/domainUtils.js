export const APP_DOMAIN = 'app.fotoflow.co';
export const LOGIN_DOMAIN = 'login.fotoflow.co';

export const isAppDomain = (hostname = window.location.hostname) =>
  hostname === APP_DOMAIN;

export const isLoginDomain = (hostname = window.location.hostname) =>
  hostname === LOGIN_DOMAIN;

export const isProductionDomain = (hostname = window.location.hostname) =>
  hostname === APP_DOMAIN || hostname === LOGIN_DOMAIN;

export const getAppBaseUrl = () => {
  if (typeof window !== 'undefined' && isProductionDomain()) {
    return `https://${APP_DOMAIN}`;
  }
  return `${window.location.protocol}//${window.location.host}`;
};

export const getAppLoginUrl = () => `${getAppBaseUrl()}/login`;

export const getLoginUrl = (path = '/login') => `https://${LOGIN_DOMAIN}${path}`;

export const getAppUrl = (path = '') => `${getAppBaseUrl()}${path}`;