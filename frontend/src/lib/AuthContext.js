import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from './api';
import { getToken, getStoredUser, setSession, clearSession } from './auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getToken);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login({ email, password });
    const { access_token, user: loggedInUser } = response.data;
    setSession(access_token, loggedInUser);
    setToken(access_token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (name, email, password) => {
    // Self-registration always creates a `staff` account. Promoting a user
    // to `admin` is an out-of-band action (e.g. directly via the API/DB),
    // which is intentional — it keeps privilege escalation off the public
    // sign-up form.
    await authApi.register({ name, email, password, role: 'staff' });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
