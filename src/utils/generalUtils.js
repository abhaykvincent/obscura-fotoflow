export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const removeUndefinedFields = (data) => {
    return Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
    );
};