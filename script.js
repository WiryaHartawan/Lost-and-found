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
emailjs.init("dAs5GtBjjvQR-Ak1C"); // Public Key Anda

let currentNick = "", currentFilter = "all", searchQuery = "", generatedOTP = "";

const tampilPesan = (msg) => {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('custom-alert').classList.remove('hidden');
};

// --- LOGIKA RESET PASSWORD ---
document.getElementById('btn-forgot-password').onclick = () => {
    document.getElementById('reset-modal').classList.remove('hidden');
    document.getElementById('step-email').classList.remove('hidden');
    document.getElementById('step-otp').classList.add('hidden');
};

document.getElementById('btn-send-otp').onclick = async () => {
    const email = document.getElementById('reset-email-input').value.trim();
    if (!email) return tampilPesan("Masukkan email!");

    const usersSnap = await get(ref(db, 'users'));
    let found = false;
    usersSnap.forEach(c => { if(c.val().email.toLowerCase() === email.toLowerCase()) found = true; });

    if (!found) return tampilPesan("Email tidak terdaftar!");

    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const btn = document.getElementById('btn-send-otp');
    btn.innerText = "Mengirim..."; btn.disabled = true;

    // GANTI "service_id" di bawah ini dengan Service ID EmailJS Anda
    emailjs.send("service_9p57qre", "template_laaee1i", {
        email: email,
        passcode: generatedOTP,
        time: new Date().toLocaleTimeString()
    }).then(() => {
        tampilPesan("OTP terkirim ke email!");
        document.getElementById('step-email').classList.add('hidden');
        document.getElementById('step-otp').classList.remove('hidden');
    }).catch(err => {
        tampilPesan("Gagal kirim OTP. Cek Service ID!");
        console.error(err);
    }).finally(() => {
        btn.innerText = "Kirim Kode OTP"; btn.disabled = false;
    });
};

document.getElementById('btn-verify-reset').onclick = async () => {
    const inputOTP = document.getElementById('otp-input').value;
    const newPass = document.getElementById('new-pass-input').value;
    const email = document.getElementById('reset-email-input').value;

    if (inputOTP !== generatedOTP) return tampilPesan("OTP Salah!");
    if (newPass.length < 6) return tampilPesan("Password min 6 karakter!");

    const s = await get(ref(db, 'users'));
    s.forEach(async (c) => {
        if(c.val().email.toLowerCase() === email.toLowerCase()) {
            await set(ref(db, `users/${c.key}/password`), newPass);
            tampilPesan("Password diperbarui! Silahkan login.");
            document.getElementById('reset-modal').classList.add('hidden');
        }
    });
};

// --- LOGIKA TEMA ---
const setTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('themePenemu', theme);
    const isDark = theme === 'dark';
    document.getElementById('theme-slider').classList.toggle('slide-dark', isDark);
    document.getElementById('text-light').classList.toggle('active', !isDark);
    document.getElementById('text-dark').classList.toggle('active', isDark);
};
document.getElementById('theme-toggle').onclick = () => setTheme(document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

// --- LOGIN & CORE ---
async function prosesLogin(id, pass) {
    const s = await get(ref(db, 'users'));
    let userKey = null;
    s.forEach(c => { if((c.key === id || c.val().email.toLowerCase() === id) && c.val().password === pass) userKey = c.key; });
    if(userKey) {
        currentNick = userKey;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = userKey.charAt(0).toUpperCase() + userKey.slice(1);
        localStorage.setItem('userPenemu', id); localStorage.setItem('passPenemu', pass);
        // loadData() logic here...
    } else {
        tampilPesan("ID/Password salah!");
    }
}
document.getElementById('btn-login-action').onclick = () => prosesLogin(document.getElementById('login-id').value.toLowerCase(), document.getElementById('login-pass').value);
document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };

window.onload = () => {
    setTheme(localStorage.getItem('themePenemu') || 'light');
    const u = localStorage.getItem('userPenemu'), p = localStorage.getItem('passPenemu');
    if(u && p) prosesLogin(u, p);
};
