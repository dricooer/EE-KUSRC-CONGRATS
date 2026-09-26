import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

/* =========================================================
   ค่าคงที่ / เนื้อเชียร์บูม — แก้ได้ตามต้องการ
   ========================================================= */
const BOOM_LINES = [
  "ไฟฟ้ามาแล้วพร้อม พร้อมมม ",
  "ไฟฟ้ามาแล้ว 3 4 ",
  "พวกเราวิศไฟฟ้ามาแล้ว เสียงเจื้อยแจ้วเรามาร้องเพลงเชียร์",
  "ฝึกงานมาเสียเพลียๆ ฝึกงานมาเสียเพลียๆ",
  "แต่วันนี้เชียร์์เรามาเชียร์ขาดใจ แต่วันนี้เชียร์์เรามาเชียร์ขาดใจ",
  "วิทไฟมีแต่คนรูปหล่อ ฟ.ต.คือไฟฟ้าดงตาล",
  "เที่ยวไปทุกถิ่นสถาน เที่ยวไปทุกถิ่นสถาน",
  "ไฟฟ้าดงตาลคือถิ่นฐานบ้านเดิม ไฟฟ้าดงตาลคือถิ่นฐานบ้านเดิม",
  "เสียงคนที่ประชาชนเอ่ย ไม่น่าเลยหาว่าเป็นอันฐพาล",
  "พวกเรานี้ถูกกล่าวขนาน พวกเรานี้ถูกกล่าวขาน",
  "เป็นอันฐพาลมานานหลายปี เป็นอันฐพาลมานานหลายปี",
  "ปีนี้สิเป็นปีใหม่ โปรดเข้าใจวิทไฟให้ดี",
  "พวกเรานั้นเป็นคนดี พวกเรานั้นเป็นคนดี ",
  "รักศักดิ์รักศรีก็ทำดีเหมือนกัน  รักศักดิ์รักศรีก็ทำดีเหมือนกัน",
];

const PRESET_COLORS = [
  "#7fd1ae", "#f2b134", "#ef6a5a", "#7ab8e0",
  "#c9a2e0", "#f6d365", "#95d5b2", "#f79d84",
];

const ACTIVE_WINDOW_MS = 45_000;   // ถือว่ายัง "อยู่ในงาน" ถ้าอัปเดตล่าสุดไม่เกินนี้
const HEARTBEAT_MS = 15_000;       // อัปเดตสถานะตัวเองทุกกี่ ms
const BOOM_VISIBLE_MS = 2500;      // เวลาที่ speech bubble ค้างอยู่บนจอ

const CLIENT_ID_KEY = "kusrc-congrats-client-id";
function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = "u-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
const CLIENT_ID = getClientId();

let myProfile = null; // { name, role, color }
let boomIndex = Math.floor(Math.random() * BOOM_LINES.length);

/* =========================================================
   Scene 1: ตั้งค่าตัวละคร
   ========================================================= */
function renderColorSwatches() {
  const grid = document.getElementById("colorSwatches");
  grid.innerHTML = "";
  PRESET_COLORS.forEach((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-swatch";
    btn.style.background = color;
    btn.dataset.color = color;
    btn.addEventListener("click", () => selectColor(color, btn));
    grid.appendChild(btn);
  });
}

let selectedRole = null;
let selectedColor = PRESET_COLORS[0];

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll(".role-btn").forEach((b) => {
    b.classList.toggle("is-selected", b.dataset.role === role);
  });
  updatePreview();
  validateSetupForm();
}

function selectColor(color, swatchEl) {
  selectedColor = color;
  document.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("is-selected"));
  if (swatchEl) swatchEl.classList.add("is-selected");
  document.getElementById("customColor").value = color;
  updatePreview();
}

function buildBlobHtml(color, isGraduate) {
  return `
    <div class="avatar-blob${isGraduate ? " is-graduate" : ""}" style="background:${color}">
      <div class="avatar-eyes"><span></span><span></span></div>
      ${isGraduate ? '<div class="avatar-collar"></div>' : ""}
    </div>`;
}

function updatePreview() {
  const preview = document.getElementById("avatarPreview");
  preview.innerHTML = buildBlobHtml(selectedColor, selectedRole === "graduate");
}

function validateSetupForm() {
  const name = document.getElementById("charName").value.trim();
  document.getElementById("joinBtn").disabled = !(selectedRole && name.length > 0);
}

function initSetupScreen() {
  renderColorSwatches();
  selectColor(PRESET_COLORS[0]);
  updatePreview();

  document.querySelectorAll(".role-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectRole(btn.dataset.role));
  });
  document.getElementById("charName").addEventListener("input", validateSetupForm);
  document.getElementById("customColor").addEventListener("input", (e) => {
    selectColor(e.target.value, null);
  });
  document.getElementById("joinBtn").addEventListener("click", joinEvent);
}

function joinEvent() {
  const name = document.getElementById("charName").value.trim();
  if (!name || !selectedRole) return;

  myProfile = { name, role: selectedRole, color: selectedColor };

  document.getElementById("screen-setup").classList.remove("screen--active");
  document.getElementById("screen-main").classList.add("screen--active");

  startPresence();
  initBoards();
}

/* =========================================================
   Confetti
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
   Scene 2: ฉากรวมตัวแบบเรียลไทม์ (presence)
   ========================================================= */
let participantsCache = new Map(); // id -> data
let firestoreApi = null;           // ฟังก์ชันที่ผูกกับ Firestore เมื่อพร้อม
const boomTimers = new Map();      // id -> timeout สำหรับซ่อน bubble

function layoutAndRender() {
  const now = Date.now();
  const all = Array.from(participantsCache.entries())
    .filter(([, p]) => now - (p.lastActive || 0) < ACTIVE_WINDOW_MS);

  const graduates = all.filter(([, p]) => p.role === "graduate");
  const juniors = all.filter(([, p]) => p.role !== "graduate");

  const container = document.getElementById("stageActors");
  const existingIds = new Set(Array.from(container.children).map((c) => c.dataset.id));
  const nowIds = new Set(all.map(([id]) => id));

  // ลบ avatar ของคนที่หลุดออกจากงานแล้ว
  existingIds.forEach((id) => {
    if (!nowIds.has(id)) {
      const el = container.querySelector(`[data-id="${CSS.escape(id)}"]`);
      if (el) el.remove();
    }
  });

  // ตำแหน่งพี่บัณฑิต: กลางเวที เรียงแนวนอนถ้ามีหลายคน
  graduates.forEach(([id, p], idx) => {
    const offset = (idx - (graduates.length - 1) / 2) * 14; // %
    placeActor(id, p, 50 + offset, 46, true);
  });

  // ตำแหน่งรุ่นน้อง: กระจายเป็นวงกลมรอบพี่บัณฑิต
  const total = juniors.length;
  juniors.forEach(([id, p], idx) => {
    const angle = (idx / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
    const radiusX = 34, radiusY = 30;
    const left = 50 + radiusX * Math.cos(angle);
    const top = 50 + radiusY * Math.sin(angle);
    placeActor(id, p, left, top, false);
  });

  document.getElementById("onlineCount").textContent = `🟢 ออนไลน์ตอนนี้ ${all.length} คน`;
}

function placeActor(id, data, leftPct, topPct, isGraduate) {
  const container = document.getElementById("stageActors");
  let el = container.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (!el) {
    el = document.createElement("div");
    el.className = "actor";
    el.dataset.id = id;
    el.innerHTML = `
      <div class="actor__bubble"></div>
      ${buildBlobHtml(data.color || "#7fd1ae", isGraduate)}
      <div class="actor__name"></div>
    `;
    container.appendChild(el);
  }
  el.classList.toggle("is-graduate", isGraduate);
  el.style.left = `${leftPct}%`;
  el.style.top = `${topPct}%`;
  el.querySelector(".actor__name").textContent =
    (isGraduate ? "🎓 " : "") + (data.name || "ไม่ระบุชื่อ") + (id === CLIENT_ID ? " (น้อง)" : "");

  const blob = el.querySelector(".avatar-blob");
  if (blob) blob.style.background = data.color || "#7fd1ae";

  // แสดงบูมถ้าเพิ่งกดมาไม่เกิน BOOM_VISIBLE_MS
  const boomAge = Date.now() - (data.boomAt || 0);
  if (data.boomAt && boomAge < BOOM_VISIBLE_MS) {
    const bubble = el.querySelector(".actor__bubble");
    bubble.textContent = data.boomLine || "บูม!";
    bubble.classList.add("is-visible");
    el.classList.add("is-booming");
    clearTimeout(boomTimers.get(id));
    boomTimers.set(
      id,
      setTimeout(() => {
        bubble.classList.remove("is-visible");
        el.classList.remove("is-booming");
      }, Math.max(BOOM_VISIBLE_MS - boomAge, 200))
    );
  }
}

function handleBoomClick() {
  const line = BOOM_LINES[boomIndex % BOOM_LINES.length];
  boomIndex += 1;
  if (firestoreApi?.updateMyPresence) {
    firestoreApi.updateMyPresence({ boomAt: Date.now(), boomLine: line });
  } else {
    // โหมดออฟไลน์: อัปเดตแค่ตัวเองในเครื่อง
    const mine = participantsCache.get(CLIENT_ID) || {};
    participantsCache.set(CLIENT_ID, { ...mine, boomAt: Date.now(), boomLine: line });
    layoutAndRender();
  }
}

async function startPresence() {
  spawnConfetti();
  document.getElementById("boomBtn").addEventListener("click", handleBoomClick);

  if (!isFirebaseConfigured) {
    // โหมดออฟไลน์ทดสอบ: เห็นแค่ตัวเองบนเวที
    participantsCache.set(CLIENT_ID, { ...myProfile, lastActive: Date.now(), boomAt: 0 });
    layoutAndRender();
    setInterval(layoutAndRender, 4000);
    return;
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
    const {
      getFirestore, doc, setDoc, updateDoc, onSnapshot, collection,
    } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const myRef = doc(db, "participants", CLIENT_ID);

    const writePresence = (extra = {}) =>
      setDoc(myRef, { ...myProfile, lastActive: Date.now(), boomAt: 0, boomLine: "", ...extra }, { merge: true });

    await writePresence();
    setInterval(() => writePresence(), HEARTBEAT_MS);
    window.addEventListener("beforeunload", () => {
      // ความพยายามลบตัวเองแบบ best-effort (ไม่รับประกันว่าจะสำเร็จเสมอ)
      updateDoc(myRef, { lastActive: 0 }).catch(() => {});
    });

    onSnapshot(
      collection(db, "participants"),
      (snapshot) => {
        participantsCache = new Map(snapshot.docs.map((d) => [d.id, d.data()]));
        layoutAndRender();
      },
      (err) => {
        console.error("presence onSnapshot error:", err);
        document.getElementById("onlineCount").textContent = "เชื่อมต่อไม่สำเร็จ";
      }
    );

    setInterval(layoutAndRender, 4000); // ให้ avatar หายไปเองเมื่อหมดเวลา แม้ไม่มี snapshot ใหม่

    firestoreApi = {
      updateMyPresence: (extra) => updateDoc(myRef, extra).catch((e) => console.error(e)),
    };
  } catch (err) {
    console.error("Firebase presence init error:", err);
    document.getElementById("onlineCount").textContent = "เชื่อมต่อไม่สำเร็จ — โหมดออฟไลน์";
    participantsCache.set(CLIENT_ID, { ...myProfile, lastActive: Date.now(), boomAt: 0 });
    layoutAndRender();
    setInterval(layoutAndRender, 4000);
  }
}

/* =========================================================
   กระดานข้อความ 2 ทาง พร้อมแก้ไขข้อความของตัวเอง
   ========================================================= */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function enterEditMode(item, message, onSave) {
  const textEl = item.querySelector(".board__message-text");
  const editBtn = item.querySelector(".board__message-edit");
  textEl.style.display = "none";
  editBtn.style.display = "none";

  const row = document.createElement("div");
  row.className = "board__message-editrow";
  row.innerHTML = `
    <textarea maxlength="200">${escapeHtml(message.message)}</textarea>
    <button type="button" class="btn btn--primary">บันทึก</button>
  `;
  item.appendChild(row);

  row.querySelector("button").addEventListener("click", () => {
    const newText = row.querySelector("textarea").value.trim();
    if (!newText) return;
    onSave(newText);
  });
}

function setupBoard({ formId, textareaId, listId, statusId, collectionName }) {
  const state = { addFn: null, updateFn: null };
  const status = document.getElementById(statusId);

  document.getElementById(formId).addEventListener("submit", async (e) => {
    e.preventDefault();
    const textarea = document.getElementById(textareaId);
    const text = textarea.value.trim();
    if (!text) return;
    const entry = { ownerId: CLIENT_ID, name: myProfile.name, message: text };
    try {
      if (state.addFn) {
        await state.addFn(entry);
      } else {
        localAdd(collectionName, entry);
      }
      textarea.value = "";
    } catch (err) {
      console.error(err);
      alert("ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้งนะ");
    }
  });

  if (!isFirebaseConfigured) {
    status.textContent = "โหมดทดสอบ (ยังไม่ได้ตั้งค่า Firebase) — เห็นเฉพาะเครื่องนี้";
    renderLocalBoard(collectionName, listId);
    state.addFn = (entry) => {
      localAdd(collectionName, entry);
      renderLocalBoard(collectionName, listId);
    };
    return;
  }

  (async () => {
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
      const {
        getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, limit, serverTimestamp,
      } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");

      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const colRef = collection(db, collectionName);
      const q = query(colRef, orderBy("createdAt", "desc"), limit(100));

      onSnapshot(
        q,
        (snapshot) => {
          const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          renderBoardWithEdit(listId, messages, (id, newText) =>
            updateDoc(doc(db, collectionName, id), { message: newText, updatedAt: serverTimestamp() })
          );
          status.textContent = "เชื่อมต่อสำเร็จ — อัปเดตแบบเรียลไทม์";
        },
        (err) => {
          console.error(err);
          status.textContent = "เชื่อมต่อ Firebase ไม่สำเร็จ";
        }
      );

      state.addFn = (entry) => addDoc(colRef, { ...entry, createdAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
      status.textContent = "เชื่อมต่อ Firebase ไม่สำเร็จ — ใช้โหมดทดสอบแทน";
      renderLocalBoard(collectionName, listId);
      state.addFn = (entry) => {
        localAdd(collectionName, entry);
        renderLocalBoard(collectionName, listId);
      };
    }
  })();
}

// เวอร์ชันแสดงผลที่ผูกปุ่มแก้ไขเข้ากับฟังก์ชันบันทึกจริง (Firestore หรือ local)
function renderBoardWithEdit(listElId, messages, saveFn) {
  const list = document.getElementById(listElId);
  if (!messages.length) {
    list.innerHTML = `<p class="board__empty">ยังไม่มีข้อความ เป็นคนแรกเลย!</p>`;
    return;
  }
  list.innerHTML = "";
  messages.forEach((m) => {
    const isMine = m.ownerId === CLIENT_ID;
    const item = document.createElement("div");
    item.className = "board__message";
    item.innerHTML = `
      <div class="board__message-head">
        <span class="board__message-name">${escapeHtml(m.name || "ไม่ระบุชื่อ")}${m.updatedAt ? " (แก้ไขแล้ว)" : ""}</span>
        ${isMine ? '<button type="button" class="board__message-edit">แก้ไข</button>' : ""}
      </div>
      <div class="board__message-text">${escapeHtml(m.message)}</div>
    `;
    if (isMine) {
      item.querySelector(".board__message-edit").addEventListener("click", () => {
        enterEditMode(item, m, async (newText) => {
          try {
            await saveFn(m.id, newText);
          } catch (err) {
            console.error(err);
            alert("แก้ไขไม่สำเร็จ ลองใหม่อีกครั้งนะ");
          }
        });
      });
    }
    list.appendChild(item);
  });
}

/* ---------- โหมดออฟไลน์ทดสอบ (localStorage) ---------- */
function localKey(name) { return `kusrc-congrats-${name}`; }
function localGet(name) {
  try { return JSON.parse(localStorage.getItem(localKey(name)) || "[]"); }
  catch { return []; }
}
function localSet(name, list) {
  localStorage.setItem(localKey(name), JSON.stringify(list.slice(0, 200)));
}
function localAdd(name, entry) {
  const list = localGet(name);
  list.unshift({ id: "local-" + Date.now(), ...entry, createdAt: Date.now() });
  localSet(name, list);
}
function renderLocalBoard(collectionName, listId) {
  const list = localGet(collectionName);
  renderBoardWithEdit(listId, list, (id, newText) => {
    const current = localGet(collectionName);
    const idx = current.findIndex((m) => m.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], message: newText, updatedAt: Date.now() };
      localSet(collectionName, current);
      renderLocalBoard(collectionName, listId);
    }
  });
}

function initBoards() {
  setupBoard({
    formId: "formToGrad", textareaId: "msgToGrad", listId: "listToGrad",
    statusId: "statusToGrad", collectionName: "messagesToGraduates",
  });
  setupBoard({
    formId: "formToJunior", textareaId: "msgToJunior", listId: "listToJunior",
    statusId: "statusToJunior", collectionName: "messagesToJuniors",
  });
}

/* =========================================================
   เริ่มต้นการทำงาน
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initSetupScreen();
});
