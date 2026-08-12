import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import * as cognito from './cognito';

type AuthContextValue = {
  user: cognito.AuthUser | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function hasAdminGroup(user: cognito.AuthUser | null): boolean {
  const groups = user?.claims['cognito:groups'];
  if (Array.isArray(groups)) {
    return groups.includes('admin');
  }

  return typeof groups === 'string' && groups.split(',').map((group) => group.trim()).includes('admin');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<cognito.AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cognito
      .getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin: hasAdminGroup(user),
      signIn: async (email, password) => {
        await cognito.signIn(email, password);
        setUser(await cognito.getCurrentUser());
      },
      signOut: () => {
        cognito.signOut();
        setUser(null);
      },
      loading,
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
