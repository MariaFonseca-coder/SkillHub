// src/firebase.js
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage"; // 👈 AÑADIDO

const firebaseConfig = {
  apiKey: "AIzaSyD7NCQcoFdWL7PLX1YUJpCiMyon73jPKwY",
  authDomain: "skillhub-603c7.firebaseapp.com",
  projectId: "skillhub-603c7",
  storageBucket: "skillhub-603c7.appspot.com",
  messagingSenderId: "273152600853",
  appId: "1:273152600853:web:072a9bc1bbb6b50af5d71c",
  measurementId: "G-47N89NW6PC"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();
const db = app.firestore();
const storage = app.storage();

export { auth, db, storage };
