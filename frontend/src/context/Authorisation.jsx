import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';



const Authorisation = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = sessionStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('users/profile/', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(response.data);
                } catch (error) {
                    sessionStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);


    const loginWithGoogle = async (googleAccessToken) => {
        const response = await api.post('users/google/', {
            access_token: googleAccessToken
        });

        const token = response.data.access;
        sessionStorage.setItem('token', token);

        const userResponse = await api.get('users/profile/', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data);
        return userResponse.data;
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setUser(null);
    };


    const login = async (email, password) => {
        debugger;
        const response = await api.post('auth/login/', { email, password });

        const token = response.data.access || response.data.token || response.data.key;
        sessionStorage.setItem('token', token);

        const userResponse = await api.get('users/profile/', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data);
        return userResponse.data;
    };

    const register = async (userData) => {
        const response = await api.post('users/register/', userData);
        return response.data;
    };

    const getRoles = async () => {
        const response = await api.get('users/roles/');
        return response.data;
    };

    const changePassword = async () => {

    }

    return (
        <Authorisation.Provider value={{ user, setUser, login, loginWithGoogle, logout, register, getRoles, changePassword, loading }}>
            {children}
        </Authorisation.Provider>
    );
};

export const useAuth = () => useContext(Authorisation);