import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

export type AuthUser = {
  email: string;
  idToken: string;
  claims: Record<string, unknown>;
};

export type NewPasswordUserAttributes = Record<string, string>;

export class NewPasswordRequiredError extends Error {
  constructor(
    public cognitoUser: CognitoUser,
    public userAttributes: NewPasswordUserAttributes
  ) {
    super('NEW_PASSWORD_REQUIRED');
    this.name = 'NewPasswordRequiredError';
  }
}

let userPool: CognitoUserPool | null = null;
let currentUser: AuthUser | null = null;

export function initCognito(): CognitoUserPool {
  if (userPool) {
    return userPool;
  }

  const UserPoolId = import.meta.env.VITE_USER_POOL_ID;
  const ClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;

  if (!UserPoolId || !ClientId) {
    throw new Error('Cognito environment variables are not configured');
  }

  userPool = new CognitoUserPool({ UserPoolId, ClientId });
  return userPool;
}

function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  if (!payload) {
    return {};
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return JSON.parse(atob(padded));
}

function sessionToUser(session: CognitoUserSession): AuthUser {
  const idToken = session.getIdToken().getJwtToken();
  const claims = decodeJwt(idToken);

  return {
    email: typeof claims.email === 'string' ? claims.email : '',
    idToken,
    claims,
  };
}

export function signUp(email: string, password: string, name: string): Promise<void> {
  const pool = initCognito();
  const attributes = [
    new CognitoUserAttribute({ Name: 'email', Value: email }),
    new CognitoUserAttribute({ Name: 'name', Value: name }),
  ];

  return new Promise((resolve, reject) => {
    pool.signUp(email, password, attributes, [], (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  const user = new CognitoUser({ Username: email, Pool: initCognito() });

  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

export function signIn(email: string, password: string): Promise<string> {
  const cognitoUser = new CognitoUser({ Username: email, Pool: initCognito() });
  const authDetails = new AuthenticationDetails({ Username: email, Password: password });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        currentUser = sessionToUser(session);
        resolve(currentUser.idToken);
      },
      onFailure: reject,
      newPasswordRequired: (userAttributes: NewPasswordUserAttributes) => {
        delete userAttributes.email_verified;
        delete userAttributes.email;
        reject(new NewPasswordRequiredError(cognitoUser, userAttributes));
      },
    });
  });
}

export function completeNewPassword(
  cognitoUser: CognitoUser,
  newPassword: string,
  userAttributes: NewPasswordUserAttributes
): Promise<string> {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
      onSuccess: (session) => {
        currentUser = sessionToUser(session);
        resolve(currentUser.idToken);
      },
      onFailure: reject,
    });
  });
}

export function signOut(): void {
  const user = initCognito().getCurrentUser();
  user?.signOut();
  currentUser = null;
}

export function getCurrentSession(): Promise<string | null> {
  if (currentUser?.idToken) {
    return Promise.resolve(currentUser.idToken);
  }

  const user = initCognito().getCurrentUser();
  if (!user) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        currentUser = null;
        resolve(null);
        return;
      }

      currentUser = sessionToUser(session);
      resolve(currentUser.idToken);
    });
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getCurrentSession();
  return token ? currentUser : null;
}

export function getClaimsFromToken(token: string): Record<string, unknown> {
  return decodeJwt(token);
}
