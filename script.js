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
let currentFilter = "all"; // 'all' atau 'mine'

// --- FUNGSI CUSTOM MODAL ---
window.tampilPesan = (msg, isConfirm = false, onConfirm = null) => {
    const modal = document.getElementById('custom-alert');
    const actions = document.getElementById('modal-actions');
    document.getElementById('modal-msg').innerText = msg;
    modal.classList.remove('hidden');

    actions.innerHTML = '';
    if (isConfirm) {
        const btnYa = document.createElement('button');
        btnYa.className = "btn-main"; btnYa.innerText = "Ya, Hapus";
        btnYa.onclick = () => { onConfirm(); modal.classList.add('hidden'); };
        
        const btnBatal = document.createElement('button');
        btnBatal.className = "btn-cancel"; btnBatal.innerText = "Batal";
        btnBatal.style.margin = "0";
        btnBatal.onclick = () => modal.classList.add('hidden');
        
        actions.appendChild(btnBatal);
        actions.appendChild(btnYa);
    } else {
        const btnOk = document.createElement('button');
        btnOk.className = "btn-main"; btnOk.innerText = "OK";
        btnOk.style.width = "100%";
        btnOk.onclick = () => modal.classList.add('hidden');
        actions.appendChild(btnOk);
    }
};

// --- LOGIN & AUTO LOGIN ---
async function loginLogic(nick, pass, isAuto = false) {
    if (!nick || !pass) return;
    const userRef = ref(db, 'users/' + nick.toLowerCase());
    const snap = await get(userRef);
    if (snap.exists() && snap.val().password === pass) {
        currentNick = nick.toLowerCase();
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = nick;
        if (isAuto || document.getElementById('remember-me').checked) {
            localStorage.setItem('savedNick', nick); localStorage.setItem('savedPass', pass);
        }
        loadData();
    } else if (!isAuto) tampilPesan("Nickname atau Password salah!");
}

// --- FILTER TAB LOGIC ---
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

// --- DATA LISTENER ---
function loadData() {
    onValue(ref(db, 'laporan_v2'), (s) => {
        const container = document.getElementById('item-list');
        container.innerHTML = "";
        const data = s.val();
        if (data) {
            Object.keys(data).reverse().forEach(id => {
                const v = data[id];
                const isMine = currentNick === v.user.toLowerCase();
                
                // Logika Filter
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
        } else { container.innerHTML = "<p style='text-align:center;color:gray;'>Kosong.</p>"; }
    });
}

window.hapusPostingan = (id) => {
    tampilPesan("Apakah Anda yakin ingin menghapus laporan ini?", true, async () => {
        await remove(ref(db, 'laporan_v2/' + id));
        tampilPesan("Laporan berhasil dihapus.");
    });
};

// --- SISANYA (POSTING, DLL) ---
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
    const n = document.getElementById('nama-barang').value;
    const l = document.getElementById('lokasi-barang').value;
    const f = document.getElementById('foto-barang').files[0];
    if (!n || !l) return tampilPesan("Isi Nama & Lokasi!");
    
    document.getElementById('btn-posting').disabled = true;
    let b64 = f ? await compress(f) : "";
    await push(ref(db, 'laporan_v2'), { item: n, loc: l, img: b64, user: currentNick });
    
    tampilPesan("Berhasil Terposting!");
    document.getElementById('nama-barang').value = ""; document.getElementById('lokasi-barang').value = "";
    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
    document.getElementById('btn-posting').disabled = false;
};

// Inisialisasi Event lainnya...
window.onload = () => {
    const sn = localStorage.getItem('savedNick'), sp = localStorage.getItem('savedPass');
    if (sn && sp) loginLogic(sn, sp, true);
};
document.getElementById('btn-login-action').onclick = () => loginLogic(document.getElementById('login-nick').value, document.getElementById('login-pass').value);
document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };
document.getElementById('go-to-reg').onclick = () => { document.getElementById('login-section').classList.add('hidden'); document.getElementById('register-section').classList.remove('hidden'); };
document.getElementById('go-to-login').onclick = () => { document.getElementById('register-section').classList.add('hidden'); document.getElementById('login-section').classList.remove('hidden'); };
document.getElementById('btn-buka-form').onclick = () => { document.getElementById('view-list').classList.add('hidden'); document.getElementById('view-form').classList.remove('hidden'); };
document.getElementById('btn-batal').onclick = () => { document.getElementById('view-form').classList.add('hidden'); document.getElementById('view-list').classList.remove('hidden'); };
document.getElementById('toggle-l').onclick = () => { 
    const p = document.getElementById('login-pass'); 
    p.type = p.type === "password" ? "text" : "password"; 
};
