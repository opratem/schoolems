const TOKEN_KEY ='token';
const ROLE_KEY = 'userRole';

const isBrowser = typeof window !== 'undefined';

export const getToken = () => {
    return isBrowser ? localStorage.getItem(TOKEN_KEY) : null;
};

export const setToken = (token) => {
    if (isBrowser) localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
    if (isBrowser) localStorage.removeItem(TOKEN_KEY);
};

export const setDevelopmentRole = (role) => {
    if (isBrowser && process.env.NODE_ENV === 'development') {
        localStorage.setItem(ROLE_KEY, role);
    }
};

export const getDevelopmentRole = () => {
    if (isBrowser || process.env.NODE_ENV !== 'development') return null;
    return localStorage.getItem(ROLE_KEY) || null;
};