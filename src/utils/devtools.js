
export function checkDevTools() {
    const outerWidth = window.outerWidth
    const innerWidth = window.innerWidth;

    // This is our simple, reliable detection method for docked tools.
    // We can detect when the viewport is smaller than the full window.
    const isDocked = (innerWidth < outerWidth);
    const devToolWidth = outerWidth - innerWidth;
    return { isDocked, devToolWidth};
}
