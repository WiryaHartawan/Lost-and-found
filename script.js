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
emailjs.init("dAs5GtBjjvQR-Ak1C");

let generatedOTP = "";

window.tampilPesan = (msg) => {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('custom-alert').classList.remove('hidden');
};

document.getElementById('btn-buka-form').onclick = () => {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
};

document.getElementById('btn-batal').onclick = () => {
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};

async function prosesLogin(id, pass, isAuto = false) {
    const s = await get(ref(db, 'users'));
    let userKey = null;
    s.forEach(c => { 
        if((c.key === id || c.val().email.toLowerCase() === id) && c.val().password === pass) {
            userKey = c.key; 
        }
    });

    if(userKey) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = userKey.charAt(0).toUpperCase() + userKey.slice(1);
        localStorage.setItem('userPenemu', userKey); 
        localStorage.setItem('passPenemu', pass);
    } else {
        if(!isAuto) tampilPesan("ID atau Password salah!");
        localStorage.clear();
    }
}

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
    emailjs.send("penemu", "template_laaee1i", {
        email: email,
        passcode: generatedOTP,
        time: new Date().toLocaleTimeString()
    }).then(() => {
        tampilPesan("OTP terkirim!");
        document.getElementById('step-email').classList.add('hidden');
        document.getElementById('step-otp').classList.remove('hidden');
    }).catch(() => {
        tampilPesan("Gagal kirim OTP!");
    }).finally(() => {
        btn.innerText = "Kirim Kode OTP"; btn.disabled = false;
    });
};

document.getElementById('btn-verify-reset').onclick = async () => {
    const inputOTP = document.getElementById('otp-input').value;
    const newPass = document.getElementById('new-pass-input').value;
    const email = document.getElementById('reset-email-input').value;
    if (inputOTP !== generatedOTP) return tampilPesan("OTP Salah!");
    if (newPass.length < 6) return tampilPesan("Min 6 Karakter!");
    const s = await get(ref(db, 'users'));
    let targetKey = null;
    s.forEach(c => { if(c.val().email.toLowerCase() === email.toLowerCase()) targetKey = c.key; });
    if(targetKey) {
        await set(ref(db, `users/${targetKey}/password`), newPass);
        localStorage.setItem('passPenemu', newPass);
        tampilPesan("Password diperbarui!");
        document.getElementById('reset-modal').classList.add('hidden');
        prosesLogin(targetKey, newPass);
    }
};

document.getElementById('btn-login-action').onclick = () => {
    prosesLogin(document.getElementById('login-id').value.toLowerCase(), document.getElementById('login-pass').value);
};

document.getElementById('btn-logout').onclick = () => {
    localStorage.clear();
    location.reload();
};

window.onload = () => {
    const u = localStorage.getItem('userPenemu');
    const p = localStorage.getItem('passPenemu');
    if(u && p) prosesLogin(u, p, true);
};
