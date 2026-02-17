import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue, get, set, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Konfigurasi Firebase
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

// --- UTILS ---
const tampilPesan = (msg) => {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('custom-alert').classList.remove('hidden');
};

function resetForm() {
    document.getElementById('nama-barang').value = "";
    document.getElementById('lokasi-barang').value = "";
    document.getElementById('deskripsi-barang').value = "";
    document.getElementById('foto-barang').value = "";
}

// --- FUNGSI PROSES LOGIN (AUTO & MANUAL) ---
async function prosesLogin(idInput, passInput, isAuto = false) {
    const usersSnap = await get(ref(db, 'users'));
    let found = false;

    usersSnap.forEach((child) => {
        const u = child.val();
        // Cek Nickname ATAU Gmail
        if ((child.key === idInput || u.email.toLowerCase() === idInput) && u.password === passInput) {
            currentNick = child.key;
            found = true;
        }
    });

    if (found) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = currentNick;
        
        // Simpan sesi untuk Auto-Login
        localStorage.setItem('userPenemu', idInput);
        localStorage.setItem('passPenemu', passInput);
        
        loadData();
    } else {
        if(!isAuto) tampilPesan("ID atau Password salah!");
    }
}

// --- LOGIN & REGISTER ---
document.getElementById('btn-login-action').onclick = () => {
    const id = document.getElementById('login-id').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;
    prosesLogin(id, pass);
};

document.getElementById('btn-register-action').onclick = async () => {
    const nick = document.getElementById('reg-nick').value.trim().toLowerCase();
    const email = document.getElementById('reg-email').value.trim();
    const wa = document.getElementById('reg-wa').value.trim();
    const pass = document.getElementById('reg-pass').value;

    if (!nick || !wa || !pass) return tampilPesan("Data tidak lengkap!");
    
    const checkUser = await get(ref(db, 'users/' + nick));
    if (checkUser.exists()) return tampilPesan("Nickname sudah dipakai!");

    await set(ref(db, 'users/' + nick), { password: pass, email: email, whatsapp: wa });
    tampilPesan("Berhasil Daftar! Silakan Login.");
    location.reload();
};

// --- TAMPILAN DATA ---
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
            const userData = users[v.user.toLowerCase()] || {};
            const waNum = userData.whatsapp || "";
            
            // Format link WhatsApp
            const waLink = `https://wa.me/${waNum.replace(/^0/, '62')}`;

            container.innerHTML += `
                <div class="card">
                    ${v.img ? `<img src="${v.img}">` : ""}
                    <div class="info-row">📦 <b>Nama Barang:</b> <span>${v.item}</span></div>
                    <div class="info-row">📍 <b>Lokasi:</b> <span>${v.loc}</span></div>
                    <div class="info-row">📝 <b>Deskripsi:</b> <span>${v.desc || '-'}</span></div>
                    <div class="info-row">👤 <b>Pelapor:</b> <span>${v.user}</span></div>
                    ${waNum ? `
                    <div class="info-row">📱 <b>Nomor:</b> 
                        <a href="${waLink}" target="_blank" class="wa-link">${waNum}</a>
                    </div>` : ""}
                    ${isMine ? `<button class="btn-delete" onclick="hapusPost('${id}')">Hapus Laporan</button>` : ""}
                </div>`;
        });
    });
}

window.hapusPost = (id) => { if(confirm("Hapus laporan ini?")) remove(ref(db, 'laporan_v2/' + id)); };

// --- POSTING ---
document.getElementById('btn-posting').onclick = async () => {
    const n = document.getElementById('nama-barang'), l = document.getElementById('lokasi-barang'), 
          d = document.getElementById('deskripsi-barang'), f = document.getElementById('foto-barang');

    if (!n.value || !l.value) return tampilPesan("Nama Barang & Lokasi wajib diisi!");
    
    let b64 = "";
    if (f.files[0]) {
        const reader = new FileReader();
        b64 = await new Promise(r => {
            reader.onload = (e) => r(e.target.result);
            reader.readAsDataURL(f.files[0]);
        });
    }

    await push(ref(db, 'laporan_v2'), { item: n.value, loc: l.value, desc: d.value, img: b64, user: currentNick });
    tampilPesan("Berhasil Terposting!");
    resetForm(); // Bersihkan form
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};

// --- NAVIGASI ---
document.getElementById('btn-buka-form').onclick = () => {
    resetForm(); // Pastikan bersih saat dibuka
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
};

document.getElementById('btn-batal').onclick = () => {
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};

document.getElementById('btn-logout').onclick = () => {
    localStorage.removeItem('userPenemu');
    localStorage.removeItem('passPenemu');
    location.reload();
};

document.getElementById('toggle-l').onclick = () => {
    const p = document.getElementById('login-pass');
    p.type = p.type === "password" ? "text" : "password";
};

// --- LOGIKA AUTO-LOGIN SAAT BUKA LINK ---
window.onload = () => {
    const savedUser = localStorage.getItem('userPenemu');
    const savedPass = localStorage.getItem('passPenemu');

    if (savedUser && savedPass) {
        prosesLogin(savedUser, savedPass, true);
    }
};
