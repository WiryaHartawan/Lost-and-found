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

// --- UTILS ---
const tampilPesan = (msg) => {
    document.getElementById('modal-msg').innerText = msg;
    document.getElementById('custom-alert').classList.remove('hidden');
};

// --- AUTH LOGIC ---
document.getElementById('btn-login-action').onclick = async () => {
    const inputID = document.getElementById('login-id').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;
    
    const usersSnap = await get(ref(db, 'users'));
    let loggedIn = false;

    usersSnap.forEach((child) => {
        const userData = child.val();
        // Cek Nickname ATAU Gmail
        if ((child.key === inputID || userData.email.toLowerCase() === inputID) && userData.password === pass) {
            currentNick = child.key;
            loggedIn = true;
        }
    });

    if (loggedIn) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = currentNick;
        localStorage.setItem('savedNick', currentNick);
        localStorage.setItem('savedPass', pass);
        loadData();
    } else tampilPesan("ID atau Password salah!");
};

document.getElementById('btn-register-action').onclick = async () => {
    const nick = document.getElementById('reg-nick').value.trim().toLowerCase();
    const email = document.getElementById('reg-email').value.trim();
    const wa = document.getElementById('reg-wa').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const conf = document.getElementById('reg-confirm').value;

    if (!nick || !email || !wa || !pass || pass !== conf) return tampilPesan("Data tidak lengkap!");
    
    const snap = await get(ref(db, 'users/' + nick));
    if (snap.exists()) return tampilPesan("Nickname sudah digunakan!");

    await set(ref(db, 'users/' + nick), { password: pass, email: email, whatsapp: wa });
    tampilPesan("Berhasil Daftar! Silakan Login.");
    location.reload();
};

// --- OTP LOGIC ---
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
        emailjs.send(SERVICE_ID, TEMPLATE_ID, { email: emailTarget, passcode: generatedOTP })
        .then(() => {
            tampilPesan("OTP terkirim!");
            document.getElementById('forgot-step-1').classList.add('hidden');
            document.getElementById('forgot-step-2').classList.remove('hidden');
        }, () => {
            tampilPesan("Gagal kirim email.");
            btn.disabled = false;
        });
    } else tampilPesan("Email tidak terdaftar!");
};

document.getElementById('btn-reset-pass').onclick = async () => {
    const otp = document.getElementById('input-otp').value;
    const nPass = document.getElementById('new-pass').value;
    if (otp === generatedOTP && nPass.length >= 6) {
        await set(ref(db, `users/${targetUserNick}/password`), nPass);
        tampilPesan("Password diubah!");
        location.reload();
    } else tampilPesan("OTP salah!");
};

// --- DATA LIST ---
function loadData() {
    onValue(ref(db, 'laporan_v2'), async (s) => {
        const container = document.getElementById('item-list');
        container.innerHTML = "";
        const data = s.val();
        if (!data) return container.innerHTML = "<p style='text-align:center;color:gray;'>Kosong.</p>";

        const usersSnap = await get(ref(db, 'users'));
        const users = usersSnap.val();

        Object.keys(data).reverse().forEach(id => {
            const v = data[id];
            const isMine = currentNick === v.user.toLowerCase();
            if (currentFilter === "mine" && !isMine) return;

            const userData = users[v.user.toLowerCase()] || {};
            const wa = userData.whatsapp || "";

            container.innerHTML += `
                <div class="card">
                    ${isMine ? `<button class="btn-delete" onclick="hapusPostingan('${id}')">Hapus</button>` : ""}
                    ${v.img ? `<img src="${v.img}">` : ""}
                    <div class="info-row">📦 <b>Nama Barang:</b> ${v.item}</div>
                    <div class="info-row">📍 <b>Lokasi:</b> ${v.loc}</div>
                    <div class="info-row">👤 <b>Pelapor:</b> ${v.user}</div>
                    ${wa && !isMine ? `
                        <a href="https://wa.me/${wa.replace(/^0/, '62')}" target="_blank" class="btn-wa">
                            Hubungi WhatsApp (${wa})
                        </a>
                    ` : ""}
                </div>`;
        });
    });
}

window.hapusPostingan = (id) => { if(confirm("Hapus laporan?")) remove(ref(db, 'laporan_v2/' + id)); };

// --- POSTING ---
document.getElementById('btn-posting').onclick = async () => {
    const n = document.getElementById('nama-barang'), l = document.getElementById('lokasi-barang'), f = document.getElementById('foto-barang');
    if (!n.value || !l.value) return tampilPesan("Isi data!");
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
document.getElementById('go-to-reg').onclick = () => { document.getElementById('login-section').classList.add('hidden'); document.getElementById('register-section').classList.remove('hidden'); };
document.getElementById('go-to-login').onclick = () => { document.getElementById('register-section').classList.add('hidden'); document.getElementById('login-section').classList.remove('hidden'); };
document.getElementById('go-to-forgot').onclick = () => { document.getElementById('login-section').classList.add('hidden'); document.getElementById('forgot-section').classList.remove('hidden'); };
document.getElementById('btn-buka-form').onclick = () => { document.getElementById('view-list').classList.add('hidden'); document.getElementById('view-form').classList.remove('hidden'); };
document.getElementById('btn-batal').onclick = () => { document.getElementById('view-form').classList.add('hidden'); document.getElementById('view-list').classList.remove('hidden'); };
document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };

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

// Password Toggle
['toggle-l', 'toggle-r1', 'toggle-r2'].forEach((id, i) => {
    document.getElementById(id).onclick = () => {
        const inp = [document.getElementById('login-pass'), document.getElementById('reg-pass'), document.getElementById('reg-confirm')][i];
        inp.type = inp.type === "password" ? "text" : "password";
    };
});

window.onload = () => {
    const sn = localStorage.getItem('savedNick'), sp = localStorage.getItem('savedPass');
    if (sn && sp) {
        document.getElementById('login-id').value = sn;
        document.getElementById('login-pass').value = sp;
        document.getElementById('btn-login-action').click();
    }
};
