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

// --- LOGIN LOGIC ---
async function loginLogic(nick, pass, isAuto = false) {
    if (!nick || !pass) return;
    const userRef = ref(db, 'users/' + nick.toLowerCase());
    const snap = await get(userRef);
    if (snap.exists() && snap.val().password === pass) {
        currentNick = nick.toLowerCase();
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('register-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = nick;
        
        localStorage.setItem('savedNick', nick);
        localStorage.setItem('savedPass', pass);
        loadData();
    } else if (!isAuto) tampilPesan("Nickname atau Password salah!");
}

window.addEventListener('load', () => {
    const sn = localStorage.getItem('savedNick'), sp = localStorage.getItem('savedPass');
    if (sn && sp) loginLogic(sn, sp, true);
});

// --- LOAD DATA & DISPLAY ---
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
                
                // Menampilkan List dengan Label Nama Barang dan Lokasi
                container.innerHTML += `
                    <div class="card">
                        ${isMine ? `<button class="btn-delete" onclick="hapusPostingan('${id}')">Hapus</button>` : ""}
                        ${v.img ? `<img src="${v.img}">` : ""}
                        <strong>📦 Nama Barang: ${v.item}</strong><br>
                        <small>📍 Lokasi: ${v.loc}</small><br>
                        ${v.desc ? `<p style="font-size: 13px; color: #444; margin: 8px 0;">${v.desc}</p>` : ""}
                        <small style="color:#1877f2;">👤 Pelapor: ${v.user}</small>
                    </div>`;
            });
        } else { container.innerHTML = "<p style='text-align:center;color:gray;'>Belum ada laporan.</p>"; }
    });
}

// --- POSTING WITH DESCRIPTION ---
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

document.getElementById('btn-posting').onclick = async () => {
    const n = document.getElementById('nama-barang'), 
          l = document.getElementById('lokasi-barang'), 
          f = document.getElementById('foto-barang'),
          d = document.getElementById('deskripsi-barang');

    if (!n.value || !l.value) return tampilPesan("Isi Nama & Lokasi!");
    
    document.getElementById('btn-posting').disabled = true;
    let b64 = f.files[0] ? await compress(f.files[0]) : "";

    await push(ref(db, 'laporan_v2'), { 
        item: n.value, 
        loc: l.value, 
        desc: d.value, 
        img: b64, 
        user: currentNick 
    });

    tampilPesan("Berhasil Terposting!");
    n.value = ""; l.value = ""; f.value = ""; d.value = ""; 
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
    document.getElementById('btn-posting').disabled = false;
};

// --- OTHER APP LOGIC ---
window.hapusPostingan = (id) => {
    tampilPesan("Apakah Anda yakin ingin menghapus laporan ini?", true, async () => {
        await remove(ref(db, 'laporan_v2/' + id));
        tampilPesan("Laporan berhasil dihapus.");
    });
};

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

document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };
document.getElementById('go-to-reg').onclick = () => { document.getElementById('login-section').classList.add('hidden'); document.getElementById('register-section').classList.remove('hidden'); };
document.getElementById('go-to-login').onclick = () => { document.getElementById('register-section').classList.add('hidden'); document.getElementById('login-section').classList.remove('hidden'); };
document.getElementById('btn-buka-form').onclick = () => { document.getElementById('view-list').classList.add('hidden'); document.getElementById('view-form').classList.remove('hidden'); };
document.getElementById('btn-batal').onclick = () => { document.getElementById('view-form').classList.add('hidden'); document.getElementById('view-list').classList.remove('hidden'); };

const regToggles = ['toggle-l', 'toggle-r1', 'toggle-r2'];
const regInputs = ['login-pass', 'reg-pass', 'reg-confirm'];
regToggles.forEach((id, i) => {
    document.getElementById(id).onclick = () => {
        const p = document.getElementById(regInputs[i]);
        p.type = p.type === "password" ? "text" : "password";
    };
});

document.getElementById('btn-register-action').onclick = async () => {
    const nick = document.getElementById('reg-nick').value.trim(), pass = document.getElementById('reg-pass').value, conf = document.getElementById('reg-confirm').value;
    if (!nick || !pass || pass !== conf) return tampilPesan("Data tidak valid!");
    const userRef = ref(db, 'users/' + nick.toLowerCase());
    const snap = await get(userRef);
    if (snap.exists()) return tampilPesan("Nickname sudah ada!");
    await set(userRef, { password: pass });
    tampilPesan("Berhasil Daftar! Silakan Login.");
    location.reload();
};
