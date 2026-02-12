
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDA7w0LXVO4veYvkKxPYKQ6HktVWrA_k5g",
  authDomain: "muriell.firebaseapp.com",
  projectId: "muriell",
  storageBucket: "muriell.firebasestorage.app",
  messagingSenderId: "217583042249",
  appId: "1:217583042249:web:dc3f80d860df9080bf9718",
  measurementId: "G-2P12HEEXLD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
