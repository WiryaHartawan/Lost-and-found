import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue, get, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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

// --- LOGIKA REGISTER ---
document.getElementById('btn-register-action').onclick = async () => {
    const nick = document.getElementById('reg-nick').value.trim().toLowerCase();
    const pass = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (!nick || !pass) return alert("Isi semua form!");
    if (pass !== confirm) return alert("Password tidak sama!");

    const userRef = ref(db, 'users/' + nick);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        alert("Nickname sudah dipakai, cari nama lain!");
    } else {
        await set(userRef, { password: pass });
        alert("Pendaftaran Berhasil! Silakan Login.");
        location.reload();
    }
};

// --- LOGIKA LOGIN ---
document.getElementById('btn-login-action').onclick = async () => {
    const nick = document.getElementById('login-nick').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;

    const userRef = ref(db, 'users/' + nick);
    const snapshot = await get(userRef);

    if (snapshot.exists() && snapshot.val().password === pass) {
        currentNick = nick;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = nick;
    } else {
        alert("Nickname atau Password salah!");
    }
};

// --- LOGIKA POSTING & GAMBAR ---
const compressImg = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 600 / img.width;
                canvas.width = 600;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
};

document.getElementById('btn-posting').onclick = async () => {
    const n = document.getElementById('barang').value;
    const l = document.getElementById('lokasi').value;
    const f = document.getElementById('foto').files[0];
    const btn = document.getElementById('btn-posting');

    if (!n || !l) return alert("Isi data!");
    btn.disabled = true;

    let imgBase64 = f ? await compressImg(f) : "";

    await push(ref(db, 'laporan_v2'), {
        nama: n, lokasi: l, gambar: imgBase64,
        pelapor: currentNick,
        waktu: new Date().toLocaleString('id-ID')
    });

    alert("Berhasil!");
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};

// --- LOGIKA TAMPIL DATA & NAVIGASI ---
document.getElementById('btn-tambah').onclick = () => {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
};
document.getElementById('btn-batal').onclick = () => {
    document.getElementById('view-list').classList.remove('hidden');
    document.getElementById('view-form').classList.add('hidden');
};

onValue(ref(db, 'laporan_v2'), (s) => {
    const container = document.getElementById('item-list');
    container.innerHTML = "";
    const data = s.val();
    if (data) {
        Object.keys(data).reverse().forEach(k => {
            const v = data[k];
            container.innerHTML += `
                <div class="card">
                    ${v.gambar ? `<img src="${v.gambar}">` : ""}
                    <strong>📦 ${v.nama}</strong><br>
                    <small>📍 ${v.lokasi}</small><br>
                    <small style="color: blue;">👤 Pelapor: ${v.pelapor}</small>
                </div>`;
        });
    }
});
