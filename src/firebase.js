import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEIdZo3CTBjEX-84ZgAmpyNtYHC2kF3uk",
  authDomain: "mentortrack-fe806.firebaseapp.com",
  projectId: "mentortrack-fe806",
  storageBucket: "mentortrack-fe806.firebasestorage.app",
  messagingSenderId: "837473058071",
  appId: "1:837473058071:web:43bc9f787ef6392ced4b52",
  measurementId: "G-BZY9X6S9LE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };