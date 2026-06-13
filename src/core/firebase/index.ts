import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging
} from 'firebase/messaging';

// Parse dynamic configuration from index.html window script or env variables
const getFirebaseConfig = () => {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  const winConfig = win.__FIREBASE_CONFIG__ || {};

  const apiKey = winConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = winConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const databaseURL = winConfig.databaseURL || import.meta.env.VITE_FIREBASE_DATABASE_URL;
  const projectId = winConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = winConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = winConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = winConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID;
  const measurementId = winConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

  // Enforce a valid syntactical API key shape during initializeApp to prevent load-time crash
  // Alphanumeric placeholder guarantees SDK works at module evaluation
  const finalApiKey = apiKey && apiKey.trim() !== '' ? apiKey : 'AIStudioMockAPIKeyPlaceholder12345678910';
  const finalProjectId = projectId && projectId.trim() !== '' ? projectId : 'aistudio-placeholder-project';

  return {
    apiKey: finalApiKey,
    authDomain: authDomain || `${finalProjectId}.firebaseapp.com`,
    databaseURL: databaseURL || `https://${finalProjectId}-default-rtdb.firebaseio.com`,
    projectId: finalProjectId,
    storageBucket: storageBucket || `${finalProjectId}.appspot.com`,
    messagingSenderId: messagingSenderId || '1234567890',
    appId: appId || '1:1234567890:web:12abc34def56gh78ij90kl',
    measurementId: measurementId || 'G-ABC123XYZ'
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

let messaging: Messaging | null = null;

// Initialize Firebase Messaging Safely
export const initializeMessaging = async (): Promise<Messaging | null> => {
  try {
    const supported = await isSupported();

    if (
      supported &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      messaging = getMessaging(app);
      return messaging;
    }

    console.warn('Firebase Messaging is not supported in this browser.');
    return null;
  } catch (error) {
    console.error('Messaging Initialization Error:', error);
    return null;
  }
};

// Request Notification Permission
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      await initializeMessaging();
    }

    if (!messaging) return null;

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission denied.');
      return null;
    }

    const swRegistration = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : undefined;
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      ...(swRegistration && { serviceWorkerRegistration: swRegistration })
    });

    console.log('FCM Token:', token);

    return token;
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
};

// Foreground Message Listener
export const onMessageListener = (): Promise<any> =>
  new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Foreground Message Received:', payload);
      resolve(payload);
    });
  });

export { messaging };

export default app;
