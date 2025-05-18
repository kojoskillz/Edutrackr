// context/AuthContext.tsx
'use client'
import { createContext, useContext, useState, useEffect } from "react";

interface AuthContextProps {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  signup: (username: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextProps | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

interface User {
  username: string;
  password: string;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = (username: string, password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    const foundUser = users.find(
      (u) => u.username === username && u.password === password
    );
    if (foundUser) {
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const signup = (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userExists: User | undefined = users.find((u: User) => u.username === username);
    if (userExists) return false;

    const newUser = { username, password };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    setUser(newUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
