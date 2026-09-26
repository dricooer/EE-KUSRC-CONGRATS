# ยินดีด้วยพี่บัณฑิต KUSRC 🎓

เว็บไซต์ Interactive สำหรับแสดงความยินดีกับบัณฑิตจบใหม่ของ KUSRC
เลือกตัวละคร → ดูตัวละครเดินเข้าฉาก → กดปุ่ม "บูม" → ฝากคำอวยพรที่กระดานข้อความแบบเรียลไทม์

ไฟล์ทั้งหมดเป็น Static (HTML/CSS/JS ล้วน ๆ) ไม่มี backend ของตัวเอง
จึงนำขึ้น GitHub Pages ได้ 100% โดยใช้ **Firebase Firestore** เป็นที่เก็บข้อความ

```
kusrc-congrats/
├── index.html          หน้าเว็บหลัก
├── style.css           สไตล์ทั้งหมด
├── script.js           โลจิกหลัก (เลือกตัวละคร, เดิน, บูม, กระดานข้อความ)
├── firebase-config.js  ← ไฟล์เดียวที่ต้องแก้ก่อนใช้งานจริง
└── README.md
```

> ถ้ายังไม่ตั้งค่า Firebase เว็บจะรันได้ทันทีในโหมดทดสอบ (เก็บข้อความไว้ใน
> localStorage ของเบราว์เซอร์ตัวเอง เห็นเฉพาะเครื่องนั้น ไม่ real-time ข้ามเครื่อง)
> เหมาะสำหรับลองเล่น UI ก่อน แต่ถ้าจะใช้งานจริงให้คนอื่นเห็นข้อความร่วมกัน
> ต้องตั้งค่า Firebase ตามขั้นตอนด้านล่าง

---

## ขั้นตอนที่ 1: ตั้งค่า Firebase (ประมาณ 10 นาที)

1. ไปที่ [Firebase Console](https://console.firebase.google.com/) แล้ว **เพิ่มโปรเจกต์ (Add project)**
   ตั้งชื่อ เช่น `kusrc-congrats` แล้วกดสร้างจนเสร็จ (ปิด Google Analytics ได้ ไม่จำเป็น)

2. ในเมนูซ้ายเลือก **Build > Firestore Database** แล้วกด **Create database**
   - เลือก location ที่ใกล้ที่สุด (เช่น `asia-southeast1`)
   - เลือกโหมดเริ่มต้นเป็น **Start in test mode** ก่อน (จะตั้งกฎความปลอดภัยในขั้นตอนที่ 3)

3. ไปที่แท็บ **Rules** ของ Firestore แล้วแทนที่ด้วยกฎนี้ เพื่อให้ทุกคน
   **อ่าน** ข้อความได้ แต่ **เขียน** ได้เฉพาะข้อความสั้น ๆ ตามฟอร์ม (กันสแปม/โจมตีเบื้องต้น):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /messages/{messageId} {
         allow read: if true;
         allow create: if request.resource.data.name is string
                       && request.resource.data.name.size() <= 40
                       && request.resource.data.message is string
                       && request.resource.data.message.size() <= 200;
         allow update, delete: if false;
       }
     }
   }
   ```

   กด **Publish**

4. กลับไปหน้า **Project settings** (ไอคอนเฟือง มุมซ้ายบน) เลื่อนลงมาที่
   **Your apps** แล้วกดไอคอน **</>** (Web) เพื่อเพิ่มเว็บแอป
   - ตั้งชื่อ nickname อะไรก็ได้ เช่น `kusrc-congrats-web`
   - **ไม่ต้อง** ติ๊ก Firebase Hosting (เราจะใช้ GitHub Pages แทน)
   - กด **Register app**

5. Firebase จะโชว์โค้ด config หน้าตาแบบนี้ ให้คัดลอกค่าไปแปะใน
   `firebase-config.js` (แทนที่ค่า `YOUR_...` ทั้งหมด):

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "kusrc-congrats.firebaseapp.com",
     projectId: "kusrc-congrats",
     storageBucket: "kusrc-congrats.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456",
   };
   ```

6. บันทึกไฟล์ — เท่านี้เว็บก็จะเชื่อมกับ Firestore จริงแล้ว
   (ค่า `apiKey`/`appId` ของ Firebase ฝั่ง client เปิดเผยได้ตามปกติ
   ความปลอดภัยจริงอยู่ที่ **Firestore Rules** ในขั้นตอนที่ 3)

---

## ขั้นตอนที่ 2: นำขึ้น GitHub Pages

1. สร้าง repository ใหม่บน GitHub เช่น `kusrc-congrats` (public)

2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ (`index.html`, `style.css`, `script.js`,
   `firebase-config.js`) ขึ้น repo — จะใช้เว็บ GitHub (drag and drop) หรือ
   คำสั่ง git ก็ได้:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: KUSRC congrats site"
   git branch -M main
   git remote add origin https://github.com/<username>/kusrc-congrats.git
   git push -u origin main
   ```

3. ไปที่ repo บน GitHub → **Settings** → **Pages**
   - ในหัวข้อ **Build and deployment** เลือก Source: **Deploy from a branch**
   - เลือก Branch: **main** และโฟลเดอร์ **/ (root)**
   - กด **Save**

4. รอสัก 1-2 นาที แล้วรีเฟรชหน้า Settings > Pages จะมีลิงก์ขึ้นมา เช่น
   `https://<username>.github.io/kusrc-congrats/`
   เปิดลิงก์นี้ได้เลย เป็นอันเสร็จ 🎉

---

## แก้ไข/ปรับแต่งเพิ่มเติม

- **เปลี่ยนตัวละคร**: แก้ array `CHARACTERS` ใน `script.js` — จะเปลี่ยน emoji,
  สี, ชื่อ หรือจะเปลี่ยนเป็นรูปภาพจริงก็ได้ (แก้ตรง `actor-sprite` /
  `character-blob` ใน `style.css` ให้ใช้ `background-image` แทน)
- **เปลี่ยนเนื้อเชียร์/บูม**: แก้ array `BOOM_LINES` ใน `script.js` ใส่เนื้อ
  บูมจริงของภาค EE KUSRC ได้เลย
- **จำกัดสแปม**: กฎ Firestore ด้านบนจำกัดความยาวข้อความไว้แล้ว
  หากต้องการกันสแปมเพิ่ม แนะนำเปิด **App Check** ใน Firebase Console
- **ลบข้อความไม่เหมาะสม**: เข้าไปลบเอกสารได้โดยตรงที่
  Firebase Console > Firestore Database > collection `messages`
