export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const removeUndefinedFields = (data) => {
    return Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    );
};

export const isAppleDevice = () => {
    // iphone, ipad,iMac, Macbook,....
    const userAgent = navigator.userAgent;
    return /iPhone|iPad|iPod|Macintosh|Mac Intel|Mac Apple Silicon/i.test(userAgent);

};

export const getOperatingSystem = () => {
    const userAgent = navigator.userAgent;
    if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(userAgent)) return 'Mac';
    if (/Win32|Win64|Windows|WinCE/i.test(userAgent)) return 'Windows';
    return 'PC';
};