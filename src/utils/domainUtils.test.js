import {
  APP_DOMAIN,
  LOGIN_DOMAIN,
  isAppDomain,
  isLoginDomain,
  isProductionDomain,
  getAppBaseUrl,
  getAppLoginUrl,
  getLoginUrl,
  getAppUrl,
} from './domainUtils';

describe('domainUtils - domain architecture helpers', () => {
  const ORIGINAL_HOSTNAME = window.location.hostname;
  const ORIGINAL_PROTOCOL = window.location.protocol;
  const ORIGINAL_HOST = window.location.host;

  const setHostname = (hostname, protocol = 'https:', host = hostname) => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, hostname, protocol, host },
    });
  };

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        hostname: ORIGINAL_HOSTNAME,
        protocol: ORIGINAL_PROTOCOL,
        host: ORIGINAL_HOST,
      },
    });
  });

  it('exposes the canonical production domains', () => {
    expect(APP_DOMAIN).toBe('app.fotoflow.co');
    expect(LOGIN_DOMAIN).toBe('login.fotoflow.co');
  });

  describe('isAppDomain / isLoginDomain / isProductionDomain', () => {
    it('detects app.fotoflow.co', () => {
      setHostname('app.fotoflow.co');
      expect(isAppDomain()).toBe(true);
      expect(isLoginDomain()).toBe(false);
      expect(isProductionDomain()).toBe(true);
    });

    it('detects login.fotoflow.co', () => {
      setHostname('login.fotoflow.co');
      expect(isAppDomain()).toBe(false);
      expect(isLoginDomain()).toBe(true);
      expect(isProductionDomain()).toBe(true);
    });

    it('does not treat local/dev hosts as production domains', () => {
      setHostname('localhost');
      expect(isAppDomain()).toBe(false);
      expect(isLoginDomain()).toBe(false);
      expect(isProductionDomain()).toBe(false);
    });

    it('supports explicit hostname argument', () => {
      expect(isAppDomain('app.fotoflow.co')).toBe(true);
      expect(isLoginDomain('login.fotoflow.co')).toBe(true);
      expect(isProductionDomain('127.0.0.1')).toBe(false);
    });
  });

  describe('getAppBaseUrl', () => {
    it('returns https://app.fotoflow.co on production custom domains', () => {
      setHostname('app.fotoflow.co');
      expect(getAppBaseUrl()).toBe('https://app.fotoflow.co');
      setHostname('login.fotoflow.co');
      expect(getAppBaseUrl()).toBe('https://app.fotoflow.co');
    });

    it('falls back to the current origin in development', () => {
      setHostname('localhost', 'http:', 'localhost:3000');
      expect(getAppBaseUrl()).toBe('http://localhost:3000');
    });
  });

  describe('URL builders', () => {
    it('builds the app login URL from the current base', () => {
      setHostname('app.fotoflow.co');
      expect(getAppLoginUrl()).toBe('https://app.fotoflow.co/login');
      setHostname('localhost', 'http:', 'localhost:3000');
      expect(getAppLoginUrl()).toBe('http://localhost:3000/login');
    });

    it('builds the canonical login entry URL', () => {
      expect(getLoginUrl()).toBe('https://login.fotoflow.co/login');
      expect(getLoginUrl('/onboarding?ref=4752')).toBe(
        'https://login.fotoflow.co/onboarding?ref=4752'
      );
    });

    it('builds app URLs under the canonical base', () => {
      setHostname('app.fotoflow.co');
      expect(getAppUrl()).toBe('https://app.fotoflow.co');
      expect(getAppUrl('/monalisa/home')).toBe('https://app.fotoflow.co/monalisa/home');
    });
  });
});