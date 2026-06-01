import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCcf1l5cB1C7uszfDoCPWz26f-hre_JMaw",
  authDomain: "astropuraan-web.firebaseapp.com",
  databaseURL: "https://astropuraan-web-default-rtdb.firebaseio.com",
  projectId: "astropuraan-web",
  storageBucket: "astropuraan-web.appspot.com",
  messagingSenderId: "1082739821536",
  appId: "1:1082739821536:web:12a928d6cdd590e3173985",
  measurementId: "G-DE7VN86NMX",
};

const app = initializeApp(firebaseConfig);
let firebase_app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(firebase_app);
const auth = getAuth(firebase_app);

const firebaseCloudMessaging = async () => {
  try {
    const messaging = getMessaging(firebase_app);
    const status = await Notification.requestPermission();
    if (status && status === "granted") {
      const fcm_token = await getToken(messaging, {
        vapidKey:
          "BHfaJ5nnL7xDhcow2xe2wKMmk2rX9NuyDDTKZYxzls0wHaso653NDX_mixFa4Z_BwRfFWrUPTXNj6i8BWDmPRBY",
      });

      if (fcm_token) {
        localStorage.setItem("fcmToken", fcm_token);
        return fcm_token;
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default app;

export { auth, firebaseCloudMessaging, database };
