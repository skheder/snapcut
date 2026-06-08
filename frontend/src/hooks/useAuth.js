import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { login as apiLogin, register as apiRegister, getMe } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        try { const { data } = await getMe(); setUser(data); }
        catch { await SecureStore.deleteItemAsync("token"); }
      }
      setLoading(false);
    })();
  }, []);

  async function login(email, password) {
    const { data } = await apiLogin({ email, password });
    await SecureStore.setItemAsync("token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(fields) {
    const { data } = await apiRegister(fields);
    await SecureStore.setItemAsync("token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await SecureStore.deleteItemAsync("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
