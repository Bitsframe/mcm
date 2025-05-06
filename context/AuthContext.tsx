"use client";

import axios from "axios";
import { createContext, useEffect, useState } from "react";

interface AuthState {
    checkingAuth: boolean;
    userProfile: any;
    allowedLocations: number[];
    userRole: string;
    permissions: string[];
    authError: any;
}

interface AuthContextType extends AuthState {
    setAuthState: (newState: Partial<AuthState>) => void;
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

                // Ensure locations is an array of numbers
                const locationIds = Array.isArray(locations) ? locations : [];

                updateAuthState({
                    checkingAuth: false,
                    userProfile: profile,
                    allowedLocations: locationIds,
                    userRole: role,
                    permissions: permissions,
                    authError: null
                });

                // Store allowed locations in localStorage for persistence
                localStorage.setItem('allowedLocations', JSON.stringify(locationIds));
            } catch (error) {
                console.error("Error fetching user data:", error);
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
