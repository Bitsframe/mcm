"use client";

import axios from "axios";
import { createContext, useEffect, useState } from "react";

interface AuthState {
    checkingAuth: boolean;
    userProfile: any;
    allowedLocations: any[];
    userRole: string;
    permissions: any[];
    authError: any;
}

export const AuthContext = createContext<AuthState>({
    checkingAuth: true,
    userProfile: null,
    allowedLocations: [],
    userRole: 'admin',
    permissions: [],
    authError: null
});

export const AuthProvider = ({ children }: any) => {
    const [authState, setAuthState] = useState({
        checkingAuth: true,
        userProfile: null,
        allowedLocations: [],
        userRole: 'admin',
        permissions: [],
        authError: null
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('/api/user');
                const { role, permissions, locations, profile } = response.data.data;

                setAuthState({
                    checkingAuth: false,
                    userProfile: profile,
                    allowedLocations: locations,
                    userRole: role,
                    permissions: permissions,
                    authError: null
                });
            } catch (error) {
                setAuthState(prev => ({
                    ...prev,
                    checkingAuth: false,
                    authError: axios.isAxiosError(error) ? error.response?.data || error.message : "Failed to fetch user data."
                }));
            }
        };

        fetchUserData();
    }, []);

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
};
