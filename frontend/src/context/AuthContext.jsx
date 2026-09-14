import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [dailySpent, setDailySpent] = useState(0);
  const [alertInfo, setAlertInfo] = useState(null);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
          if (profile.limite_diario) {
            setDailyLimit(parseFloat(profile.limite_diario));
          }
        } catch (err) {
          console.warn('Sesión previa expirada o inválida');
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.usuario);
    if (data.usuario.limite_diario) {
      setDailyLimit(parseFloat(data.usuario.limite_diario));
    }
    return data;
  };

  const register = async (nombre, email, password, limite) => {
    const data = await api.register(nombre, email, password, limite);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.usuario);
    if (data.usuario.limite_diario) {
      setDailyLimit(parseFloat(data.usuario.limite_diario));
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setDailyLimit(100);
    setDailySpent(0);
    setAlertInfo(null);
  };

  const updateLimit = async (newLimit) => {
    const parsed = parseFloat(newLimit);
    if (user && token) {
      await api.updateDailyLimit(parsed);
    }
    setDailyLimit(parsed);
    // Recalcular estado de alerta con el nuevo límite
    checkDailyLimitAlert(dailySpent, parsed);
  };

  const checkDailyLimitAlert = (spent, limit = dailyLimit) => {
    setDailySpent(spent);
    if (spent > limit) {
      setAlertInfo({
        excedido: true,
        gastado: spent,
        limite: limit,
        diferencia: spent - limit,
      });
    } else if (spent >= limit * 0.85) {
      setAlertInfo({
        cerca: true,
        gastado: spent,
        limite: limit,
        diferencia: limit - spent,
      });
    } else {
      setAlertInfo(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        dailyLimit,
        dailySpent,
        alertInfo,
        login,
        register,
        logout,
        updateLimit,
        checkDailyLimitAlert,
        setAlertInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
