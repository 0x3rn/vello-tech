import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export function getMigrationFirebaseApp() {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: required("FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL"),
      privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
    storageBucket: required("FIREBASE_STORAGE_BUCKET"),
  });
}

export function getMigrationFirestore() {
  return getFirestore(getMigrationFirebaseApp());
}

export function getMigrationBucket() {
  return getStorage(getMigrationFirebaseApp()).bucket(required("FIREBASE_STORAGE_BUCKET"));
}

export function getMigrationAuth() {
  return getAuth(getMigrationFirebaseApp());
}
