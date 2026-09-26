import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

/* =========================================================
   ข้อมูลตัวละคร (แก้ emoji/สี/ชื่อ หรือเปลี่ยนเป็นรูปจริงได้ภายหลัง)
   ถ้าจะใช้รูปจริงแทน emoji: เปลี่ยน sprite เป็น URL รูป แล้วแก้
   renderCharacterGrid() / renderActor() ให้ใส่ <img> แทน emoji
   ========================================================= */
const CHARACTERS = [
  { id: "naga", name: "น้องนาคา", emoji: "🐉", color: "#cdeedd" },
  { id: "khaosan", name: "น้องข้าวสาร", emoji: "🌾", color: "#fdeec2" },
  { id: "kaset", name: "น้องเกษตร", emoji: "🐘", color: "#dbe9f6" },
  { id: "chon", name: "น้องชล", emoji: "🌊", color: "#cfe8ee" },
];

// เนื้อเชียร์/บูม KUSRC — ใส่เนื้อจริงของภาควิชาแทนที่นี่
const BOOM_LINES = [
  "บูม~ บูม~ บูม~ EE KUSRC!",
  "ยินดีด้วยพี่บัณฑิต เก่งที่สุด!",
  "น้อง ๆ ภูมิใจในตัวพี่มาก ๆ เลย!",
  "ขอให้ก้าวหน้าในหน้าที่การงานนะครับ/คะ",
];

let selectedCharacterId = null;

/* =========================================================
   Scene 1: เลือกตัวละคร
   ========================================================= */
function renderCharacterGrid() {
  const grid = document.getElementById("characterGrid");
  grid.innerHTML = "";

  CHARACTERS.forEach((c) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "character-card";
    card.dataset.id = c.id;
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-pressed", "false");
    card.innerHTML = `
      <span class="character-blob" style="background:${c.color}">${c.emoji}</span>
      <span class="character-name">${c.name}</span>
    `;
    card.addEventListener("click", () => selectCharacter(c.id));
    grid.appendChild(card);
  });
}

function selectCharacter(id) {
  selectedCharacterId = id;
  document.querySelectorAll(".character-card").forEach((card) => {
    const isSelected = card.dataset.id === id;
    card.classList.toggle("is-selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });
  document.getElementById("confirmCharacterBtn").disabled = false;
}

function goToMainScene() {
  if (!selectedCharacterId) return;
  document.getElementById("screen-select").classList.remove("screen--active");
  const mainScreen = document.getElementById("screen-main");
  mainScreen.classList.add("screen--active");

  renderActor();
  requestAnimationFrame(() => {
    // ให้ตัวละครเดินเข้ามาหลังจากฉากแสดงผลแล้วเล็กน้อย
    const actor = document.getElementById("walkingCharacter");
    actor.classList.add("is-walking");
    setTimeout(() => actor.classList.add("is-in-place"), 50);
    setTimeout(() => actor.classList.remove("is-walking"), 2500);
  });
}

/* =========================================================
   Scene 2: ตัวละครบนฉากหลัก + ปุ่มบูม
   ========================================================= */
function renderActor() {
  const character = CHARACTERS.find((c) => c.id === selectedCharacterId);
  const sprite = document.getElementById("actorSprite");
  sprite.style.background = character.color;
  sprite.textContent = character.emoji;
}

let boomIndex = 0;
function handleBoom() {
  const actor = document.getElementById("walkingCharacter");
  const bubble = document.getElementById("speechBubble");

  actor.classList.remove("is-booming");
  // force reflow เพื่อให้เล่นแอนิเมชันซ้ำได้ทุกครั้งที่กด
  void actor.offsetWidth;
  actor.classList.add("is-booming");

  bubble.textContent = BOOM_LINES[boomIndex % BOOM_LINES.length];
  bubble.classList.remove("is-visible");
  void bubble.offsetWidth;
  bubble.classList.add("is-visible");

  boomIndex += 1;

  clearTimeout(handleBoom._hideTimer);
  handleBoom._hideTimer = setTimeout(() => {
    bubble.classList.remove("is-visible");
  }, 2200);
}

/* =========================================================
   Confetti พื้นหลังเบา ๆ
   ========================================================= */
function spawnConfetti() {
  const layer = document.getElementById("confettiLayer");
  const colors = ["#2f9e6e", "#f2b134", "#ef6a5a", "#1f6e4f"];
  const count = window.innerWidth < 600 ? 14 : 26;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${6 + Math.random() * 6}s`;
    piece.style.animationDelay = `${Math.random() * 8}s`;
    layer.appendChild(piece);
  }
}

/* =========================================================
   กระดานข้อความอวยพร — Firestore (real-time) พร้อม fallback
   เป็น localStorage เมื่อยังไม่ได้ตั้งค่า Firebase
   ========================================================= */
function renderMessages(messages) {
  const list = document.getElementById("messageList");
  if (!messages.length) {
    list.innerHTML = `<p class="board__empty">ยังไม่มีข้อความ เป็นคนแรกที่อวยพรพี่บัณฑิตสิ!</p>`;
    return;
  }
  list.innerHTML = messages
    .map(
      (m) => `
      <div class="board__message">
        <div class="board__message-name">${escapeHtml(m.name)}</div>
        <div class="board__message-text">${escapeHtml(m.message)}</div>
      </div>`
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- โหมดออฟไลน์ทดสอบ (localStorage) ---------- */
const LOCAL_KEY = "kusrc-congrats-messages";

function localGetMessages() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function localAddMessage(entry) {
  const messages = localGetMessages();
  messages.unshift(entry);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(messages.slice(0, 200)));
  renderMessages(messages);
}

/* ---------- โหมด Firebase Firestore (real-time จริง) ---------- */
let firestoreAddMessage = null;

async function initFirestore() {
  const statusEl = document.getElementById("connectionStatus");

  if (!isFirebaseConfigured) {
    statusEl.textContent =
      "โหมดทดสอบ (ยังไม่ได้ตั้งค่า Firebase) — ข้อความจะเห็นเฉพาะเครื่องนี้";
    renderMessages(localGetMessages());
    return;
  }

  try {
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js"
    );
    const {
      getFirestore,
      collection,
      addDoc,
      onSnapshot,
      query,
      orderBy,
      limit,
      serverTimestamp,
    } = await import(
      "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js"
    );

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const messagesRef = collection(db, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "desc"), limit(100));

    onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => doc.data());
        renderMessages(messages);
        statusEl.textContent = "เชื่อมต่อสำเร็จ — ข้อความอัปเดตแบบเรียลไทม์";
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        statusEl.textContent = "เชื่อมต่อ Firebase ไม่สำเร็จ ลองใหม่ภายหลัง";
      }
    );

    firestoreAddMessage = async (entry) => {
      await addDoc(messagesRef, { ...entry, createdAt: serverTimestamp() });
    };
  } catch (err) {
    console.error("Firebase init error:", err);
    statusEl.textContent = "เชื่อมต่อ Firebase ไม่สำเร็จ — ใช้โหมดทดสอบแทน";
    renderMessages(localGetMessages());
  }
}

async function handleMessageSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById("senderName");
  const messageInput = document.getElementById("senderMessage");

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (!name || !message) return;

  const entry = { name, message };

  if (firestoreAddMessage) {
    try {
      await firestoreAddMessage(entry);
    } catch (err) {
      console.error("ส่งข้อความไม่สำเร็จ:", err);
      alert("ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      return;
    }
  } else {
    localAddMessage({ ...entry, createdAt: Date.now() });
  }

  nameInput.value = "";
  messageInput.value = "";
}

/* =========================================================
   เริ่มต้นการทำงาน
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderCharacterGrid();
  spawnConfetti();
  initFirestore();

  document
    .getElementById("confirmCharacterBtn")
    .addEventListener("click", goToMainScene);
  document.getElementById("boomBtn").addEventListener("click", handleBoom);
  document
    .getElementById("messageForm")
    .addEventListener("submit", handleMessageSubmit);
});
