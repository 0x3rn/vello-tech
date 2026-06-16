import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Replace with your Firebase config or just use the existing one
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const catSnap = await getDocs(collection(db, 'categories'));
  const cats = [];
  catSnap.forEach(doc => cats.push({ id: doc.id, ...doc.data() }));
  console.log("Categories:", cats);

  const prodSnap = await getDocs(collection(db, 'products'));
  const prods = [];
  prodSnap.forEach(doc => prods.push({ id: doc.id, categoryId: doc.data().categoryId, name: doc.data().name }));
  console.log("Products Count:", prods.length);
  
  const counts = {};
  prods.forEach(p => {
    counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
  });
  console.log("Product counts by category ID:", counts);
}

run().catch(console.error);
