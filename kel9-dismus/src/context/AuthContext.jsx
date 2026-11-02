
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      const { data, error } = await getCurrentUser();

      if (!mounted) return;

      if (error) {
        console.error("Gagal mengambil user:", error.message);
      }

      setUser(data ?? null);
      setLoading(false);
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await loginUser(email, password);

    if (error) throw error;

    setUser(data?.user ?? null);
    return data;
  };

  const register = async (email, password, fullName) => {
    const { data, error } = await registerUser(
      email,
      password,
      fullName,
      "pelanggan"
    );

    if (error) throw error;

    return data;
  };

  const logout = async () => {
    const { error } = await logoutUser();

    if (error) throw error;

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth harus digunakan di dalam AuthProvider"
    );
  }

  return context;
}
