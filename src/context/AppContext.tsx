'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Role = 'admin' | 'client';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  role: Role;
  setRole: (role: Role) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('dark'); // Locked to dark mode for absolute black theme
  const [role, setRole] = useState<Role>('admin');

  useEffect(() => {
    const savedRole = localStorage.getItem('agency-dashboard-role') as Role;
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  }, []);

  const handleSetRole = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem('agency-dashboard-role', newRole);
  };

  const toggleTheme = () => {
    // No-op as theme is locked to dark mode
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, role, setRole: handleSetRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
