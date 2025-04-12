export const getToken = () => {
    return localStorage.getItem('token');
};

export const setToken = (token) => {
    localStorage.setItem('token', token);
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const setDevelopmentRole = (role) => {
    if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('userRole, role');
    }
};

export const getDevelopmentRole = () => {

if (process.env.NODE_ENV !== 'development') return null;

const role =localStorage.getItem('userRole');
return role || null;
};