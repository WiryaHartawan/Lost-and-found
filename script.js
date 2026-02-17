import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue, get, set, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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
let searchQuery = "";
let idYangAkanDihapus = null;

// Utilitas Kapital Huruf Depan
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const tampilPesan = (msg) => {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('custom-alert').classList.remove('hidden');
};

// --- LOGIKA LOGIN & AUTO-LOGIN ---
async function prosesLogin(idInput, passInput, isAuto = false) {
    const usersSnap = await get(ref(db, 'users'));
    let found = false;
    usersSnap.forEach((child) => {
        const u = child.val();
        if ((child.key === idInput || u.email.toLowerCase() === idInput) && u.password === passInput) {
            currentNick = child.key;
            found = true;
        }
    });
    if (found) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = capitalize(currentNick);
        localStorage.setItem('userPenemu', idInput);
        localStorage.setItem('passPenemu', passInput);
        loadData();
    } else if(!isAuto) tampilPesan("ID atau Password salah!");
}

document.getElementById('btn-login-action').onclick = () => {
    const id = document.getElementById('login-id').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;
    prosesLogin(id, pass);
};

// --- LOGIKA HAPUS (CUSTOM MODAL) ---
window.hapusPost = (id) => {
    idYangAkanDihapus = id;
    document.getElementById('confirm-modal').classList.remove('hidden');
};

document.getElementById('btn-confirm-yes').onclick = async () => {
    if (idYangAkanDihapus) {
        await remove(ref(db, 'laporan_v2/' + idYangAkanDihapus));
        idYangAkanDihapus = null;
        document.getElementById('confirm-modal').classList.add('hidden');
        tampilPesan("Laporan berhasil dihapus!");
    }
};

document.getElementById('btn-confirm-no').onclick = () => {
    idYangAkanDihapus = null;
    document.getElementById('confirm-modal').classList.add('hidden');
};

// --- SEARCH & DATA LOADING ---
document.getElementById('search-input').oninput = (e) => {
    searchQuery = e.target.value.toLowerCase();
    loadData();
};

function loadData() {
    onValue(ref(db, 'laporan_v2'), async (s) => {
        const container = document.getElementById('item-list');
        container.innerHTML = "";
        const data = s.val();
        if (!data) return;

        const usersSnap = await get(ref(db, 'users'));
        const users = usersSnap.val();

        Object.keys(data).reverse().forEach(id => {
            const v = data[id];
            const isMine = currentNick === v.user.toLowerCase();
            
            // Filter Slider & Search
            if (currentFilter === "mine" && !isMine) return;
            if (searchQuery && !v.item.toLowerCase().includes(searchQuery)) return;

            const userData = users[v.user.toLowerCase()] || {};
            const waNum = userData.whatsapp || "";
            const waLink = `https://wa.me/${waNum.replace(/^0/, '62')}`;

            container.innerHTML += `
                <div class="card">
                    ${v.img ? `<img src="${v.img}">` : ""}
                    <div class="info-row">📦 <b>Nama Barang:</b> <span>${v.item}</span></div>
                    <div class="info-row">📍 <b>Lokasi:</b> <span>${v.loc}</span></div>
                    <div class="info-row">📝 <b>Deskripsi:</b> <span>${v.desc || '-'}</span></div>
                    <div class="info-row">👤 <b>Pelapor:</b> <span>${capitalize(v.user)}</span></div>
                    ${waNum ? `
                    <div class="info-row">📱 <b>Nomor:</b> 
                        <a href="${waLink}" target="_blank" class="wa-link">${waNum}</a>
                    </div>` : ""}
                    ${isMine ? `<button class="btn-delete" onclick="hapusPost('${id}')">Hapus Laporan</button>` : ""}
                </div>`;
        });
    });
}

// --- TABS & NAVIGATION ---
document.getElementById('tab-all').onclick = () => {
    currentFilter = "all";
    document.getElementById('tab-bg').classList.remove('slide-right');
    document.getElementById('tab-mine').classList.remove('active');
    document.getElementById('tab-all').classList.add('active');
    loadData();
};
document.getElementById('tab-mine').onclick = () => {
    currentFilter = "mine";
    document.getElementById('tab-bg').classList.add('slide-right');
    document.getElementById('tab-all').classList.remove('active');
    document.getElementById('tab-mine').classList.add('active');
    loadData();
};

document.getElementById('btn-posting').onclick = async () => {
    const n = document.getElementById('nama-barang'), l = document.getElementById('lokasi-barang'), 
          d = document.getElementById('deskripsi-barang'), f = document.getElementById('foto-barang');
    if (!n.value || !l.value) return tampilPesan("Isi data barang!");
    let b64 = "";
    if (f.files[0]) {
        const reader = new FileReader();
        b64 = await new Promise(r => {
            reader.onload = (e) => r(e.target.result);
            reader.readAsDataURL(f.files[0]);
        });
    }
    await push(ref(db, 'laporan_v2'), { item: n.value, loc: l.value, desc: d.value, img: b64, user: currentNick });
    tampilPesan("Berhasil!");
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};

document.getElementById('btn-buka-form').onclick = () => {
    document.getElementById('nama-barang').value = "";
    document.getElementById('lokasi-barang').value = "";
    document.getElementById('deskripsi-barang').value = "";
    document.getElementById('foto-barang').value = "";
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
};
document.getElementById('btn-batal').onclick = () => {
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};

document.getElementById('btn-logout').onclick = () => {
    localStorage.clear();
    location.reload();
};

window.onload = () => {
    const savedUser = localStorage.getItem('userPenemu');
    const savedPass = localStorage.getItem('passPenemu');
    if (savedUser && savedPass) prosesLogin(savedUser, savedPass, true);
};

document.getElementById('toggle-l').onclick = () => {
    const p = document.getElementById('login-pass');
    p.type = p.type === "password" ? "text" : "password";
};
