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

export const getLocalIP = () => {
    return new Promise((resolve) => {
        try {
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel("");
            pc.createOffer().then(pc.setLocalDescription.bind(pc));
            pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
                resolve(myIP);
                pc.onicecandidate = null;
                pc.close();
            };
            // Fallback in case onicecandidate is never called or takes too long
            setTimeout(() => {
                pc.close();
                resolve(null);
            }, 1000);
        } catch (e) {
            resolve(null);
        }
    });
};