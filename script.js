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
let generatedOTP = "";
let targetUserNick = "";

// --- UI HELPERS ---
window.showSection = (id) => {
    ['login-section', 'register-section', 'forgot-section', 'main-app'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
};

window.showView = (id) => {
    ['view-list', 'view-form'].forEach(v => document.getElementById(v).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
};

window.togglePass = (id) => {
    const el = document.getElementById(id);
    el.type = el.type === "password" ? "text" : "password";
};

window.tampilPesan = (msg) => {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('custom-alert').classList.remove('hidden');
};

window.closeModal = () => document.getElementById('custom-alert').classList.add('hidden');

// --- AUTH LOGIC ---
window.handleRegister = async () => {
    const nick = document.getElementById('reg-nick').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const wa = document.getElementById('reg-wa').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const conf = document.getElementById('reg-confirm').value;

    if (!nick || !email || !wa || !pass || !conf) return tampilPesan("Lengkapi semua data!");
    if (pass !== conf) return tampilPesan("Password tidak cocok!");
    
    const snap = await get(ref(db, 'users/' + nick.toLowerCase()));
    if (snap.exists()) return tampilPesan("Nickname sudah ada!");

    await set(ref(db, 'users/' + nick.toLowerCase()), {
        password: pass,
        email: email,
        whatsapp: wa
    });
    
    tampilPesan("Berhasil Daftar!");
    showSection('login-section');
};

window.handleLogin = async () => {
    const nick = document.getElementById('login-nick').value.trim();
    const pass = document.getElementById('login-pass').value;

    const snap = await get(ref(db, 'users/' + nick.toLowerCase()));
    if (snap.exists() && snap.val().password === pass) {
        currentNick = nick.toLowerCase();
        localStorage.setItem('savedNick', nick);
        localStorage.setItem('savedPass', pass);
        document.getElementById('display-nick').innerText = nick;
        showSection('main-app');
        loadData();
    } else {
        tampilPesan("Login Gagal!");
    }
};

window.handleLogout = () => { localStorage.clear(); location.reload(); };

// --- FORGOT PASS ---
window.sendOTP = async () => {
    const emailInput = document.getElementById('forgot-email').value.trim();
    const usersSnap = await get(ref(db, 'users'));
    let found = false;

    usersSnap.forEach((child) => {
        if (child.val().email === emailInput) {
            found = true;
            targetUserNick = child.key;
        }
    });

    if (found) {
        generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        alert("KODE OTP: " + generatedOTP);
        document.getElementById('forgot-step-1').classList.add('hidden');
        document.getElementById('forgot-step-2').classList.remove('hidden');
    } else {
        tampilPesan("Gmail tidak ditemukan!");
    }
};

window.verifyAndReset = async () => {
    const userOTP = document.getElementById('input-otp').value;
    const newPass = document.getElementById('new-pass').value;

    if (userOTP === generatedOTP && newPass.length > 0) {
        await set(ref(db, `users/${targetUserNick}/password`), newPass);
        tampilPesan("Password Berhasil Diganti!");
        showSection('login-section');
    } else {
        tampilPesan("Data Salah!");
    }
};

// --- DATA LIST ---
function loadData() {
    onValue(ref(db, 'laporan_v2'), async (s) => {
        const container = document.getElementById('item-list');
        container.innerHTML = "";
        const data = s.val();
        if (!data) return container.innerHTML = "<p style='text-align:center;color:gray;'>Kosong.</p>";

        const usersSnap = await get(ref(db, 'users'));
        const usersData = usersSnap.val();

        Object.keys(data).reverse().forEach(id => {
            const v = data[id];
            const isMine = currentNick === v.user.toLowerCase();
            if (currentFilter === "mine" && !isMine) return;

            const ownerData = usersData[v.user.toLowerCase()] || {};
            const waNumber = ownerData.whatsapp || "";
            const namaKapital = v.user.charAt(0).toUpperCase() + v.user.slice(1);

            container.innerHTML += `
                <div class="card">
                    ${isMine ? `<button class="btn-delete" onclick="hapusPostingan('${id}')">Hapus</button>` : ""}
                    ${v.img ? `<img src="${v.img}">` : ""}
                    <span>📦 Nama Barang: ${v.item}</span><br>
                    <small>📍 Lokasi: ${v.loc}</small><br>
                    ${v.desc ? `<p style="font-size: 13px; color: #444; margin: 8px 0;">${v.desc}</p>` : ""}
                    <small style="color:#1877f2;">👤 Pelapor: ${namaKapital}</small>
                    ${waNumber && !isMine ? `
                        <a href="https://wa.me/${waNumber.replace(/^0/, '62')}" target="_blank" class="btn-wa">
                            Hubungi via WhatsApp
                        </a>
                    ` : ""}
                </div>`;
        });
    });
}

window.hapusPostingan = (id) => {
    if(confirm("Hapus laporan ini?")) remove(ref(db, 'laporan_v2/' + id));
};

window.setFilter = (f) => {
    currentFilter = f;
    document.getElementById('tab-bg').className = 'tab-bg' + (f === 'mine' ? ' slide-right' : '');
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + f).classList.add('active');
    loadData();
};

const compress = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image(); img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 800 / img.width; canvas.width = 800; canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
};

window.handlePosting = async () => {
    const n = document.getElementById('nama-barang'), l = document.getElementById('lokasi-barang'), 
          f = document.getElementById('foto-barang'), d = document.getElementById('deskripsi-barang');

    if (!n.value || !l.value) return tampilPesan("Isi Nama & Lokasi!");
    
    document.getElementById('btn-posting').disabled = true;
    let b64 = f.files[0] ? await compress(f.files[0]) : "";

    await push(ref(db, 'laporan_v2'), {
        item: n.value, loc: l.value, desc: d.value, img: b64, user: currentNick
    });

    tampilPesan("Terposting!");
    n.value = ""; l.value = ""; f.value = ""; d.value = "";
    showView('view-list');
    document.getElementById('btn-posting').disabled = false;
};

window.onload = () => {
    const sn = localStorage.getItem('savedNick'), sp = localStorage.getItem('savedPass');
    if (sn && sp) window.handleLogin();
};
