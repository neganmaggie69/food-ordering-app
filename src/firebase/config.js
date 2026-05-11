import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAJMTQV3ymdqiZWd-MQ3Aq51uuQeotbZGQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "spicecraftbir.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "spicecraftbir",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "spicecraftbir.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "273084428470",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:273084428470:web:b77ac3a6c85a3c6307b617",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-P8SJTRRW99"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Firebase Auth debugging in development
if (import.meta.env.DEV) {
  // Enable debug logging
  auth.settings.appVerificationDisabledForTesting = false;
  
  // Uncomment these lines if you want to use Firebase emulators for local development
  // if (!auth._delegate._config.emulator) {
  //   connectAuthEmulator(auth, "http://localhost:9099");
  // }
  // if (!db._delegate._databaseId.projectId.includes('localhost')) {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  // }
}

export default app;