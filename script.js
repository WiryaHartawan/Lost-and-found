import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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

let currentNick = "", generatedOTP = "";

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

function loadData() {
    onValue(ref(db, 'laporan_v2'), (s) => {
        const container = document.getElementById('item-list');
        container.innerHTML = "";
        const data = s.val();
        if (!data) return;
        Object.keys(data).reverse().forEach(id => {
            const v = data[id];
            container.innerHTML += `
                <div class="card">
                    ${v.img ? `<img src="${v.img}">` : ""}
                    <p><b>📦 Barang:</b> ${v.item}</p>
                    <p><b>📍 Lokasi:</b> ${v.loc}</p>
                    <p><b>👤 Pelapor:</b> ${v.user}</p>
                </div>`;
        });
    });
}

document.getElementById('btn-posting').onclick = async () => {
    const item = document.getElementById('nama-barang').value;
    const loc = document.getElementById('lokasi-barang').value;
    const desc = document.getElementById('deskripsi-barang').value;
    const file = document.getElementById('foto-barang').files[0];

    if (!item || !loc) return tampilPesan("Nama dan Lokasi wajib diisi!");

    let imgBase64 = "";
    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            imgBase64 = reader.result;
            await simpanLaporan(item, loc, desc, imgBase64);
        };
    } else {
        await simpanLaporan(item, loc, desc, "");
    }
};

async function simpanLaporan(item, loc, desc, img) {
    const newRef = push(ref(db, 'laporan_v2'));
    await set(newRef, {
        item: item,
        loc: loc,
        desc: desc,
        img: img,
        user: currentNick,
        time: Date.now()
    });
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
    tampilPesan("Berhasil diposting!");
}

async function prosesLogin(id, pass, isAuto = false) {
    const s = await get(ref(db, 'users'));
    let userKey = null;
    s.forEach(c => { 
        if((c.key === id || c.val().email.toLowerCase() === id) && c.val().password === pass) {
            userKey = c.key; 
        }
    });

    if(userKey) {
        currentNick = userKey;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = userKey;
        localStorage.setItem('userPenemu', userKey); 
        localStorage.setItem('passPenemu', pass);
        loadData();
    } else {
        if(!isAuto) tampilPesan("ID atau Password salah!");
        localStorage.clear();
    }
}

document.getElementById('btn-login-action').onclick = () => {
    prosesLogin(document.getElementById('login-id').value.toLowerCase(), document.getElementById('login-pass').value);
};

document.getElementById('btn-logout').onclick = () => {
    localStorage.clear();
    location.reload();
};

document.getElementById('btn-forgot-password').onclick = () => {
    document.getElementById('reset-modal').classList.remove('hidden');
    document.getElementById('step-email').classList.remove('hidden');
    document.getElementById('step-otp').classList.add('hidden');
};

document.getElementById('btn-send-otp').onclick = async () => {
    const email = document.getElementById('reset-email-input').value.trim();
    const usersSnap = await get(ref(db, 'users'));
    let found = false;
    usersSnap.forEach(c => { if(c.val().email.toLowerCase() === email.toLowerCase()) found = true; });
    if (!found) return tampilPesan("Email tidak terdaftar!");
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    emailjs.send("penemu", "template_laaee1i", {
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
    const inputOTP = document.getElementById('otp-input').value;
    const newPass = document.getElementById('new-pass-input').value;
    const email = document.getElementById('reset-email-input').value;
    if (inputOTP !== generatedOTP) return tampilPesan("OTP Salah!");
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

window.onload = () => {
    const u = localStorage.getItem('userPenemu');
    const p = localStorage.getItem('passPenemu');
    if(u && p) prosesLogin(u, p, true);
};
