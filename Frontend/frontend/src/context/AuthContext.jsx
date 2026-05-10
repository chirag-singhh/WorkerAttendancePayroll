import {
  createContext,
  useContext,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({
  children,
}) => {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(false);


  // LOGIN
  const login = async (
    email,
    password
  ) => {

    try {

      setLoading(true);

      await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      const userRes =
        await api.get("/auth/me");

      setUser(userRes.data);

      return {
        success: true,
      };

    } catch (error) {

      return {
        success: false,
        message:
          error.response?.data?.message,
      };

    } finally {

      setLoading(false);

    }
  };


  // REGISTER
  const register = async (
    name,
    email,
    password
  ) => {

    try {

      setLoading(true);

      await api.post(
        "/auth/register",
        {
          name,
          email,
          password,
        }
      );

      const userRes =
        await api.get("/auth/me");

      setUser(userRes.data);

      return {
        success: true,
      };

    } catch (error) {

      return {
        success: false,
        message:
          error.response?.data?.message,
      };

    } finally {

      setLoading(false);

    }
  };


  // LOGOUT
  const logout = async () => {

    await api.post("/auth/logout");

    setUser(null);

  };


  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);