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

interface AuthContextType extends AuthState {
    setAuthState: (state: Partial<AuthState>) => void;
}

const initialAuthState: AuthState = {
    checkingAuth: true,
    userProfile: null,
    allowedLocations: [],
    userRole: 'admin',
    permissions: [],
    authError: null
};

export const AuthContext = createContext<AuthContextType>({
    ...initialAuthState,
    setAuthState: () => {}
});

export const AuthProvider = ({ children }: any) => {
    const [authState, setAuthState] = useState<AuthState>(initialAuthState);

    const updateAuthState = (newState: Partial<AuthState>) => {
        setAuthState(prev => ({
            ...prev,
            ...newState
        }));
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('/api/user');
                const { role, permissions, locations, profile } = response.data.data;

                console.log("RESPONSE -> ", response);
                updateAuthState({
                    checkingAuth: false,
                    userProfile: profile,
                    allowedLocations: locations,
                    userRole: role,
                    permissions: permissions,
                    authError: null
                });
            } catch (error) {
                console.log("ERROR -> ", error);
                updateAuthState({
                    checkingAuth: false,
                    authError: axios.isAxiosError(error) ? error.response?.data || error.message : "Failed to fetch user data."
                });
            }
        };

        fetchUserData();
    }, []);

    return (
        <AuthContext.Provider value={{ ...authState, setAuthState: updateAuthState }}>
            {children}
        </AuthContext.Provider>
    );
};
