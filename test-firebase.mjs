import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

try {
  const app = initializeApp(firebaseConfig);
  console.log('--- Firebase Connection Check ---');
  console.log('Status: SUCCESS');
  console.log('App Name:', app.name);
  console.log('Project ID:', app.options.projectId);
  console.log('Auth Domain:', app.options.authDomain);
  console.log('---------------------------------');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}
