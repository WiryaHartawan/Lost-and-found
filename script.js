import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue, get, set, remove, off } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBw9bZb08ux2Ft2ywM4Kygo3-FYEfWD-6I",
    authDomain: "lostfound-927df.firebaseapp.com",
    projectId: "lostfound-927df",
    databaseURL: "https://lostfound-927df-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "lostfound-927df.firebasestorage.app",
    messagingSenderId: "659071189789",
    appId: "1:659071189789:web:f83742d4fb804b175a57f4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let currentNick = "";
let currentFilter = "all";
let activeChatRef = null;

// --- MODAL ---
window.tampilPesan = (msg, isConfirm = false, onConfirm = null) => {
    const modal = document.getElementById('custom-alert');
    const actions = document.getElementById('modal-actions');
    document.getElementById('modal-msg').innerText = msg;
    modal.classList.remove('hidden');
    actions.innerHTML = '';
    if (isConfirm) {
        const bB = document.createElement('button'); bB.className="btn-cancel"; bB.innerText="Batal";
        bB.onclick = () => modal.classList.add('hidden');
        const bY = document.createElement('button'); bY.className="btn-main"; bY.innerText="Ya, Hapus"; bY.style.background="#ff4d4d";
        bY.onclick = () => { onConfirm(); modal.classList.add('hidden'); };
        actions.appendChild(bB); actions.appendChild(bY);
    } else {
        const bO = document.createElement('button'); bO.className="btn-main"; bO.innerText="OK";
        bO.onclick = () => modal.classList.add('hidden');
        actions.appendChild(bO);
    }
};

// --- AUTH ---
async function loginLogic(nick, pass, isAuto = false) {
    if (!nick || !pass) return;
    const snap = await get(ref(db, 'users/' + nick.toLowerCase()));
    if (snap.exists() && snap.val().password === pass) {
        currentNick = nick.toLowerCase();
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('register-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = nick;
        localStorage.setItem('savedNick', nick); localStorage.setItem('savedPass', pass);
        loadData();
    } else if (!isAuto) tampilPesan("Nickname atau Password salah!");
}

// --- INTERNAL CHAT LOGIC ---
window.bukaChat = (targetUser) => {
    if (targetUser.toLowerCase() === currentNick) return tampilPesan("Ini postingan Anda sendiri.");
    
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
    document.getElementById('chat-with-name').innerText = targetUser;
    
    // Buat Room ID Unik (Urutan Alfabet agar ID konsisten)
    const roomId = [currentNick, targetUser.toLowerCase()].sort().join("_");
    const chatBox = document.getElementById('chat-messages');
    
    if (activeChatRef) off(activeChatRef);
    activeChatRef = ref(db, 'chats/' + roomId);

    onValue(activeChatRef, (s) => {
        chatBox.innerHTML = "";
        const data = s.val();
        if (data) {
            Object.values(data).forEach(m => {
                const div = document.createElement('div');
                div.className = `msg ${m.sender === currentNick ? 'msg-me' : 'msg-them'}`;
                div.innerHTML = `${m.text} <span class="msg-time">${m.time}</span>`;
                chatBox.appendChild(div);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    document.getElementById('btn-send-chat').onclick = () => {
        const input = document.getElementById('chat-input');
        if (!input.value.trim()) return;
        push(activeChatRef, {
            sender: currentNick,
            text: input.value,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        input.value = "";
    };
};

document.getElementById('btn-back-chat').onclick = () => {
    document.getElementById('chat-section').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    if (activeChatRef) off(activeChatRef);
};

// --- DATA LISTENER ---
function loadData() {
    onValue(ref(db, 'laporan_v2'), (s) => {
        const container = document.getElementById('item-list');
        container.innerHTML = "";
        const data = s.val();
        if (data) {
            Object.keys(data).reverse().forEach(id => {
                const v = data[id];
                const isMine = currentNick === v.user.toLowerCase();
                if (currentFilter === "mine" && !isMine) return;
                container.innerHTML += `
                    <div class="card">
                        ${isMine ? `<button class="btn-delete" onclick="hapusPostingan('${id}')">Hapus</button>` : ""}
                        ${v.img ? `<img src="${v.img}">` : ""}
                        <strong>📦 ${v.item}</strong><br>
                        <small>📍 ${v.loc}</small><br>
                        <small>👤 Pelapor: <span class="chat-link" onclick="bukaChat('${v.user}')">${v.user}</span></small>
                    </div>`;
            });
        }
    });
}

// --- LAIN-LAIN (POSTING, DLL) ---
window.hapusPostingan = (id) => {
    tampilPesan("Hapus laporan ini?", true, async () => {
        await remove(ref(db, 'laporan_v2/' + id));
    });
};

document.getElementById('btn-posting').onclick = async () => {
    const n = document.getElementById('nama-barang'), l = document.getElementById('lokasi-barang'), f = document.getElementById('foto-barang');
    if (!n.value || !l.value) return tampilPesan("Isi data!");
    
    let b64 = "";
    if (f.files[0]) {
        const reader = new FileReader();
        b64 = await new Promise(r => {
            reader.onload = (e) => r(e.target.result);
            reader.readAsDataURL(f.files[0]);
        });
    }

    await push(ref(db, 'laporan_v2'), { item: n.value, loc: l.value, img: b64, user: currentNick });
    tampilPesan("Berhasil!");
    n.value=""; l.value=""; f.value="";
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};

// UI Navigation
window.onload = () => {
    const sn = localStorage.getItem('savedNick'), sp = localStorage.getItem('savedPass');
    if (sn && sp) loginLogic(sn, sp, true);
};
document.getElementById('btn-login-action').onclick = () => loginLogic(document.getElementById('login-nick').value, document.getElementById('login-pass').value);
document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };
document.getElementById('go-to-reg').onclick = () => { document.getElementById('login-section').classList.add('hidden'); document.getElementById('register-section').classList.remove('hidden'); };
document.getElementById('go-to-login').onclick = () => { document.getElementById('register-section').classList.add('hidden'); document.getElementById('login-section').classList.remove('hidden'); };
document.getElementById('btn-buka-form').onclick = () => { document.getElementById('view-list').classList.add('hidden'); document.getElementById('view-form').classList.remove('hidden'); };
document.getElementById('btn-batal').onclick = () => { document.getElementById('view-form').classList.add('hidden'); document.getElementById('view-list').classList.remove('hidden'); };
document.getElementById('tab-all').onclick = () => { currentFilter="all"; document.getElementById('tab-bg').classList.remove('slide-right'); loadData(); };
document.getElementById('tab-mine').onclick = () => { currentFilter="mine"; document.getElementById('tab-bg').classList.add('slide-right'); loadData(); };

document.getElementById('btn-register-action').onclick = async () => {
    const n = document.getElementById('reg-nick').value.trim(), p = document.getElementById('reg-pass').value, c = document.getElementById('reg-confirm').value;
    if (!n || p !== c) return tampilPesan("Data salah!");
    await set(ref(db, 'users/' + n.toLowerCase()), { password: p });
    tampilPesan("Berhasil! Silakan Login.");
    location.reload();
};
