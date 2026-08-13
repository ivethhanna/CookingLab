import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import type { CognitoUser } from 'amazon-cognito-identity-js';
import * as cognito from './cognito';

type PendingNewPassword = {
  cognitoUser: CognitoUser;
  userAttributes: cognito.NewPasswordUserAttributes;
};

type AuthContextValue = {
  user: cognito.AuthUser | null;
  pendingNewPassword: PendingNewPassword | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
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
  const [pendingNewPassword, setPendingNewPassword] = useState<PendingNewPassword | null>(null);
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
      pendingNewPassword,
      isAdmin: hasAdminGroup(user),
      signIn: async (email, password) => {
        try {
          await cognito.signIn(email, password);
          setPendingNewPassword(null);
          setUser(await cognito.getCurrentUser());
        } catch (err) {
          if (err instanceof cognito.NewPasswordRequiredError) {
            setPendingNewPassword({
              cognitoUser: err.cognitoUser,
              userAttributes: err.userAttributes,
            });
            return;
          }

          throw err;
        }
      },
      completeNewPassword: async (newPassword) => {
        if (!pendingNewPassword) {
          throw new Error('No hay cambio de password pendiente.');
        }

        await cognito.completeNewPassword(
          pendingNewPassword.cognitoUser,
          newPassword,
          pendingNewPassword.userAttributes
        );
        setPendingNewPassword(null);
        setUser(await cognito.getCurrentUser());
      },
      signOut: () => {
        cognito.signOut();
        setPendingNewPassword(null);
        setUser(null);
      },
      loading,
    }),
    [loading, pendingNewPassword, user]
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
