import React, { useEffect, useState } from 'react';
import { AuthService } from '../utils/authService';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    AuthService.onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        window.localStorage.setItem('supabase_user_id', user.id);
      } else {
        window.localStorage.removeItem('supabase_user_id');
      }
    });
    AuthService.getUser().then(setUser);
  }, []);

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to continue.</div>;
  }

  return <>{children}</>;
};

export default AuthProvider;
