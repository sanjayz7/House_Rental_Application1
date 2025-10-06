import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { role, name, userId, email }
  const [token, setToken] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    if (saved) setUser(JSON.parse(saved));
    if (savedToken) setToken(savedToken);
  }, []);

  const saveSession = (tokenValue, userValue) => {
    setToken(tokenValue);
    setUser(userValue);
    localStorage.setItem('auth_token', tokenValue);
    localStorage.setItem('auth_user', JSON.stringify(userValue));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  const value = useMemo(() => ({ user, token, saveSession, logout }), [user, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
