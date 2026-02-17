import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue, get, set, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// --- KONFIGURASI ---
const firebaseConfig = {
    apiKey: "AIzaSyBw9bZb08ux2Ft2ywM4Kygo3-FYEfWD-6I",
    authDomain: "lostfound-927df.firebaseapp.com",
    projectId: "lostfound-927df",
    databaseURL: "https://lostfound-927df-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "lostfound-927df.firebasestorage.app",
    messagingSenderId: "659071189789",
    appId: "1:659071189789:web:f83742d4fb804b175a57f4"
};

const SERVICE_ID = "penemu"; 
const TEMPLATE_ID = "template_laaee1i"; 
const PUBLIC_KEY = "dAs5GtBjjvQR-Ak1C"; 

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
emailjs.init(PUBLIC_KEY);

let currentNick = "";
let currentFilter = "all";
let generatedOTP = "";
let targetUserNick = "";

// --- CUSTOM MODAL ---
window.tampilPesan = (msg, isConfirm = false, onConfirm = null) => {
    const modal = document.getElementById('custom-alert');
    const actions = document.getElementById('modal-actions');
    document.getElementById('modal-msg').innerText = msg;
    modal.classList.remove('hidden');
    actions.innerHTML = '';

    if (isConfirm) {
        const btnBatal = document.createElement('button');
        btnBatal.className = "btn-cancel"; btnBatal.innerText = "Batal";
        btnBatal.onclick = () => modal.classList.add('hidden');
        const btnYa = document.createElement('button');
        btnYa.className = "btn-main"; btnYa.innerText = "Ya, Hapus";
        btnYa.style.background = "#ff4d4d";
        btnYa.onclick = () => { onConfirm(); modal.classList.add('hidden'); };
        actions.appendChild(btnBatal);
        actions.appendChild(btnYa);
    } else {
        const btnOk = document.createElement('button');
        btnOk.className = "btn-main"; btnOk.innerText = "OK";
        btnOk.onclick = () => modal.classList.add('hidden');
        actions.appendChild(btnOk);
    }
};

// --- AUTH LOGIC ---
async function loginLogic(nick, pass, isAuto = false) {
    if (!nick || !pass) return;
    const snap = await get(ref(db, 'users/' + nick.toLowerCase()));
    if (snap.exists() && snap.val().password === pass) {
        currentNick = nick.toLowerCase();
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = nick;
        localStorage.setItem('savedNick', nick);
        localStorage.setItem('savedPass', pass);
        loadData();
    } else if (!isAuto) tampilPesan("Nickname atau Password salah!");
}

document.getElementById('btn-register-action').onclick = async () => {
    const nick = document.getElementById('reg-nick').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const wa = document.getElementById('reg-wa').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const conf = document.getElementById('reg-confirm').value;

    if (!nick || !email || !wa || !pass || pass !== conf) return tampilPesan("Data tidak valid!");
    const userRef = ref(db, 'users/' + nick.toLowerCase());
    const snap = await get(userRef);
    if (snap.exists()) return tampilPesan("Nickname sudah ada!");

    await set(userRef, { password: pass, email: email, whatsapp: wa });
    tampilPesan("Berhasil Daftar! Silakan Login.");
    location.reload();
};

// --- LUPA PASSWORD & OTP ---
document.getElementById('go-to-forgot').onclick = () => {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('forgot-section').classList.remove('hidden');
};

document.getElementById('btn-send-otp').onclick = async () => {
    const emailTarget = document.getElementById('forgot-email-input').value.trim();
    const btn = document.getElementById('btn-send-otp');
    const usersSnap = await get(ref(db, 'users'));
    let found = false;

    usersSnap.forEach((child) => {
        if (child.val().email === emailTarget) {
            found = true;
            targetUserNick = child.key;
        }
    });

    if (found) {
        btn.disabled = true; btn.innerText = "Mengirim...";
        generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

        emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            email: emailTarget,
            passcode: generatedOTP
        }).then(() => {
            tampilPesan("OTP terkirim!");
            document.getElementById('forgot-step-1').classList.add('hidden');
            document.getElementById('forgot-step-2').classList.remove('hidden');
        }, (err) => {
            tampilPesan("Gagal kirim email.");
            btn.disabled = false; btn.innerText = "Kirim Kode OTP";
        });
    } else tampilPesan("Email tidak terdaftar!");
};

document.getElementById('btn-reset-pass').onclick = async () => {
    const userOTP = document.getElementById('input-otp').value;
    const newPass = document.getElementById('new-pass').value;
    if (userOTP === generatedOTP && newPass.length >= 6) {
        await set(ref(db, `users/${targetUserNick}/password`), newPass);
        tampilPesan("Password berhasil diubah!");
        location.reload();
    } else tampilPesan("OTP salah atau password terlalu pendek!");
};

// --- DATA & POSTING ---
function loadData() {
    onValue(ref(db, 'laporan_v2'), (s) => {
        const container = document.getElementById('item-list');
        container.innerHTML = "";
        const data = s.val();
        if (data) {
            Object.keys(data).reverse().forEach(id => {
                const v = data[id];
                const isMine = currentNick === v.user.toLowerCase();
                if (currentFilter === "mine" && !isMine) return;
                container.innerHTML += `
                    <div class="card">
                        ${isMine ? `<button class="btn-delete" onclick="hapusPostingan('${id}')">Hapus</button>` : ""}
                        ${v.img ? `<img src="${v.img}">` : ""}
                        <strong>📦 ${v.item}</strong><br>
                        <small>📍 ${v.loc}</small><br>
                        <small style="color:#1877f2;">👤 Pelapor: ${v.user}</small>
                    </div>`;
            });
        } else container.innerHTML = "<p style='text-align:center;color:gray;'>Belum ada laporan.</p>";
    });
}

window.hapusPostingan = (id) => {
    tampilPesan("Hapus laporan ini?", true, async () => {
        await remove(ref(db, 'laporan_v2/' + id));
    });
};

document.getElementById('btn-posting').onclick = async () => {
    const n = document.getElementById('nama-barang'), l = document.getElementById('lokasi-barang'), f = document.getElementById('foto-barang');
    if (!n.value || !l.value) return tampilPesan("Isi Nama & Lokasi!");
    
    let b64 = "";
    if (f.files[0]) {
        const reader = new FileReader();
        b64 = await new Promise(r => {
            reader.onload = (e) => r(e.target.result);
            reader.readAsDataURL(f.files[0]);
        });
    }

    await push(ref(db, 'laporan_v2'), { item: n.value, loc: l.value, img: b64, user: currentNick });
    tampilPesan("Terposting!");
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
};

// --- UI EVENTS ---
document.getElementById('btn-login-action').onclick = () => loginLogic(document.getElementById('login-nick').value, document.getElementById('login-pass').value);
document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };
document.getElementById('go-to-reg').onclick = () => { document.getElementById('login-section').classList.add('hidden'); document.getElementById('register-section').classList.remove('hidden'); };
document.getElementById('go-to-login').onclick = () => { document.getElementById('register-section').classList.add('hidden'); document.getElementById('login-section').classList.remove('hidden'); };
document.getElementById('btn-buka-form').onclick = () => { document.getElementById('view-list').classList.add('hidden'); document.getElementById('view-form').classList.remove('hidden'); };
document.getElementById('btn-batal').onclick = () => { document.getElementById('view-form').classList.add('hidden'); document.getElementById('view-list').classList.remove('hidden'); };

document.getElementById('tab-all').onclick = () => {
    currentFilter = "all";
    document.getElementById('tab-bg').classList.remove('slide-right');
    document.getElementById('tab-mine').classList.remove('active');
    document.getElementById('tab-all').classList.add('active');
    loadData();
};
document.getElementById('tab-mine').onclick = () => {
    currentFilter = "mine";
    document.getElementById('tab-bg').classList.add('slide-right');
    document.getElementById('tab-all').classList.remove('active');
    document.getElementById('tab-mine').classList.add('active');
    loadData();
};

const regToggles = ['toggle-l', 'toggle-r1', 'toggle-r2'];
const regInputs = ['login-pass', 'reg-pass', 'reg-confirm'];
regToggles.forEach((id, i) => {
    document.getElementById(id).onclick = () => {
        const p = document.getElementById(regInputs[i]);
        p.type = p.type === "password" ? "text" : "password";
    };
});

window.addEventListener('load', () => {
    const sn = localStorage.getItem('savedNick'), sp = localStorage.getItem('savedPass');
    if (sn && sp) loginLogic(sn, sp, true);
});
