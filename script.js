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

// --- SISTEM SHOW/HIDE PASSWORD ---
const setupToggle = (btnId, inputId) => {
    const btn = document.getElementById(btnId);
    if(btn) {
        btn.onclick = function() {
            const x = document.getElementById(inputId);
            if (x.type === "password") { x.type = "text"; this.innerText = "TUTUP"; }
            else { x.type = "password"; this.innerText = "LIHAT"; }
        };
    }
};
setupToggle('toggle-l', 'login-pass');
setupToggle('toggle-r1', 'reg-pass');
setupToggle('toggle-r2', 'reg-confirm');

// --- SISTEM LOGIN UTAMA ---
async function loginLogic(nick, pass, isAuto = false) {
    if (!nick || !pass) return;
    const userRef = ref(db, 'users/' + nick.toLowerCase());
    const snapshot = await get(userRef);

    if (snapshot.exists() && snapshot.val().password === pass) {
        currentNick = nick;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('register-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = nick;

        if (document.getElementById('remember-me').checked || isAuto) {
            localStorage.setItem('savedNick', nick);
            localStorage.setItem('savedPass', pass);
        }
    } else {
        if (!isAuto) alert("Nickname atau Password salah!");
    }
}

// Auto Login saat refresh
window.addEventListener('load', () => {
    const sNick = localStorage.getItem('savedNick');
    const sPass = localStorage.getItem('savedPass');
    if (sNick && sPass) loginLogic(sNick, sPass, true);
});

// --- EVENT HANDLERS ---
document.getElementById('btn-login-action').onclick = () => {
    loginLogic(document.getElementById('login-nick').value.trim(), document.getElementById('login-pass').value);
};

document.getElementById('btn-logout').onclick = () => {
    localStorage.clear();
    location.reload();
};

document.getElementById('go-to-reg').onclick = () => {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
};

document.getElementById('go-to-login').onclick = () => {
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
};

document.getElementById('btn-register-action').onclick = async () => {
    const nick = document.getElementById('reg-nick').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const conf = document.getElementById('reg-confirm').value;

    if (!nick || !pass) return alert("Lengkapi data!");
    if (pass !== conf) return alert("Konfirmasi password salah!");

    const userRef = ref(db, 'users/' + nick.toLowerCase());
    const check = await get(userRef);
    if (check.exists()) return alert("Nickname sudah ada!");

    await set(userRef, { password: pass });
    alert("Berhasil Daftar! Silakan Login.");
    location.reload();
};

// --- POSTING & GAMBAR ---
const compress = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 800 / img.width;
                canvas.width = 800; canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
};

document.getElementById('btn-posting').onclick = async () => {
    const inputNama = document.getElementById('nama-barang');
    const inputLokasi = document.getElementById('lokasi-barang');
    const inputFoto = document.getElementById('foto-barang');
    const btn = document.getElementById('btn-posting');

    const n = inputNama.value.trim();
    const l = inputLokasi.value.trim();
    const f = inputFoto.files[0];

    if (!n || !l) return alert("Isi Nama & Lokasi!");
    if (f && f.size > 5 * 1024 * 1024) return alert("Foto Max 5MB!");

    btn.disabled = true; 
    btn.innerText = "Memproses...";
    
    try {
        let b64 = f ? await compress(f) : "";

        await push(ref(db, 'laporan_v2'), {
            item: n, 
            loc: l, 
            img: b64, 
            user: currentNick, 
            time: new Date().toLocaleString('id-ID')
        });

        alert("Berhasil Terposting!");

        // PERBAIKAN BUG: Kosongkan Form setelah Berhasil
        inputNama.value = "";
        inputLokasi.value = "";
        inputFoto.value = "";

        // Kembali ke list
        document.getElementById('view-form').classList.add('hidden');
        document.getElementById('view-list').classList.remove('hidden');

    } catch (err) {
        alert("Gagal posting: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Posting Sekarang";
    }
};

// --- DATA DISPLAY ---
onValue(ref(db, 'laporan_v2'), (s) => {
    const container = document.getElementById('item-list');
    container.innerHTML = "";
    const data = s.val();
    if (data) {
        Object.keys(data).reverse().forEach(id => {
            const v = data[id];
            container.innerHTML += `
                <div class="card">
                    ${v.img ? `<img src="${v.img}" alt="Barang">` : ""}
                    <div style="padding: 5px;">
                        <strong>📦 ${v.item}</strong><br>
                        <small>📍 ${v.loc}</small><br>
                        <small style="color:#1877f2;">👤 Pelapor: ${v.user}</small><br>
                        <i style="font-size: 10px; color: gray;">${v.time}</i>
                    </div>
                </div>`;
        });
    } else { 
        container.innerHTML = "<p style='text-align: center; color: gray;'>Belum ada laporan.</p>"; 
    }
});

// Navigasi Form
document.getElementById('btn-buka-form').onclick = () => {
    document.getElementById('view-list').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
};

document.getElementById('btn-batal').onclick = () => {
    // Kosongkan form saat batal agar tidak terbawa ke pembukaan berikutnya
    document.getElementById('nama-barang').value = "";
    document.getElementById('lokasi-barang').value = "";
    document.getElementById('foto-barang').value = "";
    
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};
