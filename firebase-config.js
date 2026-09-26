// ============================================================
// firebase-config.js
//
// นี่คือไฟล์เดียวที่ต้องแก้ก่อน deploy จริง!
// ไปที่ Firebase Console > Project settings > General
// แล้วคัดลอกค่า config ของโปรเจกต์มาแปะแทนค่าด้านล่าง
// (ดูขั้นตอนแบบละเอียดใน README.md)
// ============================================================

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ถ้ายังไม่ได้ตั้งค่า Firebase จริง (apiKey ยังเป็นค่า placeholder)
// เว็บจะสลับไปใช้ "โหมดออฟไลน์ทดสอบ" อัตโนมัติ โดยเก็บข้อความไว้ใน
// localStorage ของเบราว์เซอร์แทน (เห็นเฉพาะเครื่องตัวเอง ไม่ real-time
// ข้ามเครื่อง) เพื่อให้ทดสอบ UI ได้ก่อนตั้งค่า Firebase จริง
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
