import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  Auth as WorkersAuth,
  ServiceAccountCredential,
  type FirebaseIdToken,
  type KeyStorer,
} from "firebase-auth-cloudflare-workers";

type AuthIdentity = FirebaseIdToken & {
  uid: string;
  email?: string;
  name?: string;
  auth_time: number;
};

type SessionOptions = { expiresIn: number };

interface ServerAuth {
  verifyIdToken(token: string, checkRevoked?: boolean): Promise<AuthIdentity>;
  verifySessionCookie(cookie: string, checkRevoked?: boolean): Promise<AuthIdentity>;
  createSessionCookie(token: string, options: SessionOptions): Promise<string>;
}

class MemoryKeyStore implements KeyStorer {
  private value: unknown = null;
  private expiresAt = 0;

  async get<ExpectedValue = unknown>(): Promise<ExpectedValue | null> {
    if (Date.now() >= this.expiresAt) return null;
    return this.value as ExpectedValue;
  }

  async put(value: string, expirationTtl: number): Promise<void> {
    this.value = JSON.parse(value) as unknown;
    this.expiresAt = Date.now() + expirationTtl * 1000;
  }
}

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(name + " is required for Firebase server authentication.");
  return value;
}

function createWorkersAuth(): ServerAuth {
  const projectId = requiredEnvironmentVariable("FIREBASE_PROJECT_ID");
  const credential = new ServiceAccountCredential(JSON.stringify({
    project_id: projectId,
    client_email: requiredEnvironmentVariable("FIREBASE_CLIENT_EMAIL"),
    private_key: requiredEnvironmentVariable("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }));

  // The package's singleton uses one key store for both Firebase ID-token keys
  // and session-cookie keys. Those are different Google key sets, so sharing the
  // cache makes whichever verifier runs second reject valid tokens by `kid`.
  // Separate instances keep the two caches isolated while retaining revocation
  // checks and the service-account-backed session-cookie exchange.
  const WorkersAuthConstructor = WorkersAuth as unknown as new (
    authProjectId: string,
    keyStore: KeyStorer,
    authCredential: ServiceAccountCredential,
  ) => ServerAuth;
  const idTokenAuth = new WorkersAuthConstructor(projectId, new MemoryKeyStore(), credential);
  const sessionCookieAuth = new WorkersAuthConstructor(projectId, new MemoryKeyStore(), credential);

  return {
    verifyIdToken: (token, checkRevoked) => idTokenAuth.verifyIdToken(token, checkRevoked),
    createSessionCookie: (token, options) => idTokenAuth.createSessionCookie(token, options),
    verifySessionCookie: (cookie, checkRevoked) => sessionCookieAuth.verifySessionCookie(cookie, checkRevoked),
  };
}

function createNodeAuth(): ServerAuth {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: requiredEnvironmentVariable("FIREBASE_PROJECT_ID"),
        clientEmail: requiredEnvironmentVariable("FIREBASE_CLIENT_EMAIL"),
        privateKey: requiredEnvironmentVariable("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
      }),
    });
  }

  return getAuth() as ServerAuth;
}

const adminAuth = process.env.DEPLOYMENT_PLATFORM === "cloudflare"
  ? createWorkersAuth()
  : createNodeAuth();

export { adminAuth };
