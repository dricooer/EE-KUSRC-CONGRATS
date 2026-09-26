// ============================================================
// firebase-config.js — KUSRC Congrats
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCIkRx_stvGKWzwpgfnV7YPFDAgvtg0ME8",
  authDomain: "kusrc-congrats.firebaseapp.com",
  projectId: "kusrc-congrats",
  storageBucket: "kusrc-congrats.firebasestorage.app",
  messagingSenderId: "591400855542",
  appId: "1:591400855542:web:dc1ebb1872025c5bc949d7",
  measurementId: "G-QQVWFBNDWX"
};

// ชื่อ collection ที่เก็บคำอวยพรใน Firestore
export const WISH_COLLECTION = "wishes";

// เช็กว่าตั้งค่า Firebase จริงแล้วหรือยัง
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
