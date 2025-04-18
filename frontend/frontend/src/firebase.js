// src/firebase.js
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7NCQcoFdWL7PLX1YUJpCiMyon73jPKwY",
  authDomain: "skillhub-603c7.firebaseapp.com",
  projectId: "skillhub-603c7",
  storageBucket: "skillhub-603c7.firebasestorage.app",
  messagingSenderId: "273152600853",
  appId: "1:273152600853:web:072a9bc1bbb6b50af5d71c",
  measurementId: "G-47N89NW6PC"
};

firebase.initializeApp(firebaseConfig);
  
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };