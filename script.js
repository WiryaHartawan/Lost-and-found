import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue, get, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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
let searchQuery = "";
let idYangAkanDihapus = null;

// Kapitalisasi
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

// --- LOGIKA DARK MODE ---
const themeToggle = document.getElementById('theme-toggle');
const themeSlider = document.getElementById('theme-slider');
const textLight = document.getElementById('text-light');
const textDark = document.getElementById('text-dark');

function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('themePenemu', theme);
    
    if (theme === 'dark') {
        themeSlider.classList.add('slide-dark');
        textLight.classList.remove('active');
        textDark.classList.add('active');
    } else {
        themeSlider.classList.remove('slide-dark');
        textLight.classList.add('active');
        textDark.classList.remove('active');
    }
}

themeToggle.onclick = toggleTheme;

// --- DATA & SEARCH ---
function loadData() {
    onValue(ref(db, 'laporan_v2'), async (s) => {
        const container = document.getElementById('item-list');
        container.innerHTML = "";
        const data = s.val();
        if (!data) return;

        const usersSnap = await get(ref(db, 'users'));
        const users = usersSnap.val() || {};

        Object.keys(data).reverse().forEach(id => {
            const v = data[id];
            const isMine = currentNick === v.user.toLowerCase();
            if (currentFilter === "mine" && !isMine) return;
            if (searchQuery && !v.item.toLowerCase().includes(searchQuery)) return;

            const userData = users[v.user.toLowerCase()] || {};
            const waNum = userData.whatsapp || "";
            const waLink = `https://wa.me/${waNum.replace(/^0/, '62')}`;

            container.innerHTML += `
                <div class="card">
                    ${v.img ? `<img src="${v.img}">` : ""}
                    <div class="info-row">📦 <b>Nama Barang:</b> <span>${v.item}</span></div>
                    <div class="info-row">📍 <b>Lokasi:</b> <span>${v.loc}</span></div>
                    <div class="info-row">👤 <b>Pelapor:</b> <span>${capitalize(v.user)}</span></div>
                    ${waNum ? `<div class="info-row">📱 <b>Nomor:</b> <a href="${waLink}" target="_blank" class="wa-link">${waNum}</a></div>` : ""}
                    ${isMine ? `<button class="btn-delete" onclick="hapusPost('${id}')">Hapus Laporan</button>` : ""}
                </div>`;
        });
    });
}

// Event Listeners (Pencarian & Tab)
document.getElementById('search-input').oninput = (e) => { searchQuery = e.target.value.toLowerCase(); loadData(); };
document.getElementById('tab-all').onclick = () => { currentFilter = "all"; document.getElementById('tab-bg').classList.remove('slide-right'); document.getElementById('tab-mine').classList.remove('active'); document.getElementById('tab-all').classList.add('active'); loadData(); };
document.getElementById('tab-mine').onclick = () => { currentFilter = "mine"; document.getElementById('tab-bg').classList.add('slide-right'); document.getElementById('tab-all').classList.remove('active'); document.getElementById('tab-mine').classList.add('active'); loadData(); };

// Login & Modal
async function prosesLogin(id, pass, auto = false) {
    const s = await get(ref(db, 'users'));
    let found = false;
    s.forEach(c => { if((c.key === id || c.val().email.toLowerCase() === id) && c.val().password === pass) { currentNick = c.key; found = true; }});
    if(found) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = capitalize(currentNick);
        localStorage.setItem('userPenemu', id); localStorage.setItem('passPenemu', pass);
        loadData();
    }
}

window.hapusPost = (id) => { idYangAkanDihapus = id; document.getElementById('confirm-modal').classList.remove('hidden'); };
document.getElementById('btn-confirm-yes').onclick = async () => { if(idYangAkanDihapus) await remove(ref(db, 'laporan_v2/'+idYangAkanDihapus)); document.getElementById('confirm-modal').classList.add('hidden'); };
document.getElementById('btn-confirm-no').onclick = () => document.getElementById('confirm-modal').classList.add('hidden');

window.onload = () => {
    // Muat Tema Terakhir
    const savedTheme = localStorage.getItem('themePenemu') || 'light';
    setTheme(savedTheme);

    const u = localStorage.getItem('userPenemu'), p = localStorage.getItem('passPenemu');
    if(u && p) prosesLogin(u, p, true);
};

document.getElementById('btn-login-action').onclick = () => prosesLogin(document.getElementById('login-id').value.toLowerCase(), document.getElementById('login-pass').value);
document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };
document.getElementById('btn-buka-form').onclick = () => { document.getElementById('view-list').classList.add('hidden'); document.getElementById('view-form').classList.remove('hidden'); };
document.getElementById('btn-batal').onclick = () => { document.getElementById('view-form').classList.add('hidden'); document.getElementById('view-list').classList.remove('hidden'); };
