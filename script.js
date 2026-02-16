import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Status Login
let userData = null;
onAuthStateChanged(auth, (user) => {
    if (user) {
        userData = user;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-name').innerText = user.displayName || user.email.split('@')[0];
    } else {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }
});

// Fungsi Login
document.getElementById('btn-google-login').onclick = () => signInWithPopup(auth, provider);
document.getElementById('btn-email-auth').onclick = async () => {
    const e = document.getElementById('email-input').value;
    const p = document.getElementById('pass-input').value;
    try {
        await signInWithEmailAndPassword(auth, e, p);
    } catch {
        await createUserWithEmailAndPassword(auth, e, p).catch(err => alert(err.message));
    }
};
document.getElementById('btn-logout').onclick = () => signOut(auth);

// Fungsi Kompres Gambar (Max 5MB)
const compressImg = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 800 / img.width;
                canvas.width = 800;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
};

// Posting Data
document.getElementById('btn-posting').onclick = async () => {
    const n = document.getElementById('barang').value;
    const l = document.getElementById('lokasi').value;
    const f = document.getElementById('foto').files[0];
    const btn = document.getElementById('btn-posting');

    if (!n || !l) return alert("Lengkapi data!");
    btn.disabled = true; btn.innerText = "Sabar ya...";

    let imgBase64 = f ? await compressImg(f) : "";

    await push(ref(db, 'laporan_v2'), {
        nama: n, lokasi: l, gambar: imgBase64,
        pelapor: userData.displayName || userData.email.split('@')[0],
        waktu: new Date().toLocaleString('id-ID')
    });

    alert("Berhasil!");
    location.reload();
};

// Navigasi & Tampil Data
document.getElementById('btn-tambah').onclick = () => {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
};
document.getElementById('btn-batal').onclick = () => location.reload();

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
                    <small style="color: blue;">👤 Oleh: ${v.pelapor}</small>
                </div>`;
        });
    }
});
