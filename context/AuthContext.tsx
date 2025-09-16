import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  login: (credentials: Omit<User, 'hashedPassword'> & { password: string }) => Promise<void>;
  signup: (credentials: Omit<User, 'hashedPassword'> & { password: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In a real app, this would be a secure, server-side operation.
// This is a simple simulation for demonstration purposes.
const mockHash = async (password: string) => `mock_hashed_${password}`;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('currentUser');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage", error);
      // Clear corrupted storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const login = async ({ email, password }: Omit<User, 'hashedPassword'> & { password: string }) => {
    const storedUsers: (User & {hashedPassword: string})[] = JSON.parse(localStorage.getItem('users') || '[]');
    const user = storedUsers.find(u => u.email === email);
    const passwordHash = await mockHash(password);
    
    if (user && user.hashedPassword === passwordHash) {
      const mockToken = `mock_jwt_${Date.now()}`;
      setToken(mockToken);
      setCurrentUser({ email: user.email });
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('currentUser', JSON.stringify({ email: user.email }));
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const signup = async ({ email, password }: Omit<User, 'hashedPassword'> & { password: string }) => {
    const storedUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    if (storedUsers.some(u => u.email === email)) {
      throw new Error('User with this email already exists');
    }
    const hashedPassword = await mockHash(password);
    const newUser = { email, hashedPassword };
    storedUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(storedUsers));
    
    // Automatically log in after signup
    await login({email, password});
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, login, signup, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
