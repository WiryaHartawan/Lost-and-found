import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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

// INISIALISASI EMAILJS
emailjs.init("dAs5GtBjjvQR-Ak1C"); 

let generatedOTP = "";

window.tampilPesan = (msg) => {
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

    // Cek apakah email terdaftar di Firebase
    const usersSnap = await get(ref(db, 'users'));
    let userFound = false;
    usersSnap.forEach(c => { if(c.val().email.toLowerCase() === email.toLowerCase()) userFound = true; });

    if (!userFound) return tampilPesan("Email tidak terdaftar di sistem Penemu!");

    // Generate OTP & Kirim
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const btn = document.getElementById('btn-send-otp');
    btn.innerText = "Mengirim..."; btn.disabled = true;

    // Menggunakan Service ID: penemu & Template ID: template_laaee1i
    emailjs.send("penemu", "template_laaee1i", {
        email: email,             // Untuk {{email}}
        passcode: generatedOTP,    // Untuk {{passcode}}
        time: new Date().toLocaleTimeString() // Untuk {{time}}
    }).then(() => {
        tampilPesan("Kode OTP telah dikirim ke email!");
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

    if (inputOTP !== generatedOTP) return tampilPesan("Kode OTP Salah!");
    if (newPass.length < 6) return tampilPesan("Password baru minimal 6 karakter!");

    const s = await get(ref(db, 'users'));
    s.forEach(async (c) => {
        if(c.val().email.toLowerCase() === email.toLowerCase()) {
            await set(ref(db, `users/${c.key}/password`), newPass);
            tampilPesan("Sukses! Silahkan login dengan password baru.");
            document.getElementById('reset-modal').classList.add('hidden');
        }
    });
};

// --- LOGIN DASAR ---
document.getElementById('btn-login-action').onclick = async () => {
    const id = document.getElementById('login-id').value.toLowerCase();
    const pass = document.getElementById('login-pass').value;
    
    const s = await get(ref(db, 'users'));
    let valid = false;
    s.forEach(c => { if((c.key === id || c.val().email.toLowerCase() === id) && c.val().password === pass) valid = c.key; });

    if(valid) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = valid;
    } else {
        tampilPesan("ID atau Password salah!");
    }
};

document.getElementById('btn-logout').onclick = () => location.reload();
