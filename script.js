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
emailjs.init("USER_PUBLIC_KEY_ANDA"); // Ganti dengan Public Key EmailJS Anda

let currentNick = "", currentFilter = "all", searchQuery = "", generatedOTP = "", idYangAkanDihapus = null;

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
const tampilPesan = (msg) => { document.getElementById('modal-msg').innerText = msg; document.getElementById('custom-alert').classList.remove('hidden'); };

// --- THEME ENGINE ---
const setTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('themePenemu', theme);
    if (theme === 'dark') {
        document.getElementById('theme-slider').classList.add('slide-dark');
        document.getElementById('text-light').classList.remove('active');
        document.getElementById('text-dark').classList.add('active');
    } else {
        document.getElementById('theme-slider').classList.remove('slide-dark');
        document.getElementById('text-light').classList.add('active');
        document.getElementById('text-dark').classList.remove('active');
    }
};

document.getElementById('theme-toggle').onclick = () => setTheme(document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

// --- RESET PASSWORD ENGINE ---
document.getElementById('btn-forgot-password').onclick = () => {
    document.getElementById('reset-modal').classList.remove('hidden');
    document.getElementById('step-email').classList.remove('hidden');
    document.getElementById('step-otp').classList.add('hidden');
};

document.getElementById('btn-send-otp').onclick = async () => {
    const email = document.getElementById('reset-email-input').value;
    const usersSnap = await get(ref(db, 'users'));
    let userFound = false;
    usersSnap.forEach(c => { if(c.val().email.toLowerCase() === email.toLowerCase()) userFound = true; });

    if(!userFound) return tampilPesan("Email tidak terdaftar!");

    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Sesuai template gambar Anda
    emailjs.send("service_id", "template_id", {
        email: email,
        passcode: generatedOTP,
        time: new Date().toLocaleTimeString()
    }).then(() => {
        tampilPesan("OTP terkirim!");
        document.getElementById('step-email').classList.add('hidden');
        document.getElementById('step-otp').classList.remove('hidden');
    });
};

document.getElementById('btn-verify-reset').onclick = async () => {
    if(document.getElementById('otp-input').value !== generatedOTP) return tampilPesan("OTP Salah!");
    const email = document.getElementById('reset-email-input').value;
    const newPass = document.getElementById('new-pass-input').value;
    
    const s = await get(ref(db, 'users'));
    s.forEach(async c => {
        if(c.val().email.toLowerCase() === email.toLowerCase()) {
            await set(ref(db, `users/${c.key}/password`), newPass);
            tampilPesan("Sukses! Silahkan Login.");
            document.getElementById('reset-modal').classList.add('hidden');
        }
    });
};

// --- CORE APP ---
function loadData() {
    onValue(ref(db, 'laporan_v2'), async (s) => {
        const container = document.getElementById('item-list'); container.innerHTML = "";
        const data = s.val(); if (!data) return;
        const uSnap = await get(ref(db, 'users')); const users = uSnap.val() || {};

        Object.keys(data).reverse().forEach(id => {
            const v = data[id];
            if (currentFilter === "mine" && currentNick !== v.user.toLowerCase()) return;
            if (searchQuery && !v.item.toLowerCase().includes(searchQuery)) return;

            const wa = (users[v.user.toLowerCase()] || {}).whatsapp || "";
            container.innerHTML += `
                <div class="card">
                    ${v.img ? `<img src="${v.img}">` : ""}
                    <div class="info-row">📦 <b>${v.item}</b></div>
                    <div class="info-row">📍 <b>${v.loc}</b></div>
                    <div class="info-row">👤 <b>${capitalize(v.user)}</b></div>
                    ${wa ? `<a href="https://wa.me/${wa.replace(/^0/,'62')}" target="_blank" class="wa-link">Chat Pelapor</a>` : ""}
                    ${currentNick === v.user.toLowerCase() ? `<button class="btn-delete" onclick="hapusPost('${id}')">Hapus</button>` : ""}
                </div>`;
        });
    });
}

// Global functions for HTML
window.hapusPost = (id) => { idYangAkanDihapus = id; document.getElementById('confirm-modal').classList.remove('hidden'); };
document.getElementById('btn-confirm-yes').onclick = async () => { if(idYangAkanDihapus) await remove(ref(db, `laporan_v2/${idYangAkanDihapus}`)); document.getElementById('confirm-modal').classList.add('hidden'); };
document.getElementById('btn-confirm-no').onclick = () => document.getElementById('confirm-modal').classList.add('hidden');

// Initialization
window.onload = () => {
    setTheme(localStorage.getItem('themePenemu') || 'light');
    const u = localStorage.getItem('userPenemu'), p = localStorage.getItem('passPenemu');
    if(u && p) prosesLogin(u, p, true);
};

// ... (Login logic & Tabs logic sama seperti versi sebelumnya)
