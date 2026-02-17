import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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

let currentNick = "", currentUserPhone = "", generatedOTP = "", allData = {};

// --- FUNGSI RESET FORM ---
function resetForm() {
    document.getElementById('nama-barang').value = "";
    document.getElementById('lokasi-barang').value = "";
    document.getElementById('deskripsi-barang').value = "";
    document.getElementById('foto-barang').value = "";
}

// --- TAMPIL PESAN ---
window.tampilPesan = (msg, isConfirm = false, onConfirm = null) => {
    document.getElementById('modal-msg').innerText = msg;
    const okBtn = document.getElementById('alert-ok');
    const cancelBtn = document.getElementById('alert-cancel');
    const modal = document.getElementById('custom-alert');
    modal.classList.remove('hidden');
    if (isConfirm) {
        okBtn.innerText = "Ya, Hapus";
        cancelBtn.classList.remove('hidden');
        okBtn.onclick = () => { if (onConfirm) onConfirm(); modal.classList.add('hidden'); };
        cancelBtn.onclick = () => modal.classList.add('hidden');
    } else {
        okBtn.innerText = "OK";
        cancelBtn.classList.add('hidden');
        okBtn.onclick = () => modal.classList.add('hidden');
    }
};

// --- LOGIKA NAVIGASI FORM ---
document.getElementById('go-to-register').onclick = () => {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
};
document.getElementById('go-to-login').onclick = () => {
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
};

// --- BUAT AKUN BARU ---
document.getElementById('btn-register-action').onclick = async () => {
    const nick = document.getElementById('reg-nick').value.trim().toLowerCase();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const confirmPass = document.getElementById('reg-confirm-pass').value;

    if(!nick || !email || !phone || !pass) return tampilPesan("Semua data wajib diisi!");
    if(pass !== confirmPass) return tampilPesan("Konfirmasi password tidak cocok!");

    const userRef = ref(db, `users/${nick}`);
    const check = await get(userRef);
    if(check.exists()) return tampilPesan("Nickname sudah digunakan!");

    await set(userRef, { email, phone, password: pass });
    tampilPesan("Akun berhasil dibuat! Silakan login.");
    document.getElementById('go-to-login').click();
};

// --- LOGIKA LOGIN ---
async function prosesLogin(id, pass, isAuto = false) {
    const s = await get(ref(db, 'users'));
    let userData = null;
    let userKey = null;

    s.forEach(c => { 
        if((c.key === id || c.val().email.toLowerCase() === id) && c.val().password === pass) {
            userKey = c.key;
            userData = c.val();
        }
    });

    if(userKey) {
        currentNick = userKey;
        currentUserPhone = userData.phone; // Ambil nomor dari database
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('register-section').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('display-nick').innerText = userKey.charAt(0).toUpperCase() + userKey.slice(1);
        localStorage.setItem('userPenemu', userKey); 
        localStorage.setItem('passPenemu', pass);
        loadData();
    } else if(!isAuto) {
        tampilPesan("ID atau Password salah!");
    }
}

// --- RENDER & SEARCH ---
function loadData() {
    onValue(ref(db, 'laporan_v2'), (s) => {
        allData = s.val() || {};
        renderData();
    });
}

function renderData(filter = "") {
    const container = document.getElementById('item-list');
    container.innerHTML = "";
    Object.keys(allData).reverse().forEach(id => {
        const v = allData[id];
        if (v.item.toLowerCase().includes(filter)) {
            const isOwner = v.user === currentNick;
            const namaKapital = v.user.charAt(0).toUpperCase() + v.user.slice(1);
            const formatWA = v.phone.startsWith('0') ? '62' + v.phone.slice(1) : v.phone;
            
            // --- LOGIKA TANGGAL & WAKTU ---
            const d = new Date(v.time);
            const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d.getDay()];
            const tanggalStr = `(${hari}, ${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()})`;
            const jamStr = `(${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')})`;

            container.innerHTML += `
                <div class="card">
                    ${v.img ? `<img src="${v.img}">` : ""}
                    <p><b>📦 Barang:</b> ${v.item}</p>
                    <p><b>📍 Lokasi:</b> ${v.loc}</p>
                    <p><b>📝 Deskripsi:</b> ${v.desc}</p>
                    <p><b>👤 Pelapor:</b> ${namaKapital}</p>
                    <p><b>📱 Nomor:</b> <a class="wa-link" href="https://wa.me/${formatWA}" target="_blank">${v.phone}</a></p>
                    
                    <div style="margin-top: 10px; color: #888; font-size: 10px; display: flex; gap: 5px;">
                        <span>${tanggalStr}</span>
                        <span>${jamStr}</span>
                    </div>

                    ${isOwner ? `<button class="btn-del" onclick="hapusLaporan('${id}')">Hapus Laporan</button>` : ""}
                </div>`;
        }
    });
}
// --- POSTING (MENGAMBIL NOMOR DARI AKUN) ---
document.getElementById('btn-posting').onclick = async () => {
    const item = document.getElementById('nama-barang').value;
    const loc = document.getElementById('lokasi-barang').value;
    const desc = document.getElementById('deskripsi-barang').value;
    const file = document.getElementById('foto-barang').files[0];

    if (!item || !loc) return tampilPesan("Nama Barang dan Lokasi wajib diisi!");

    const pushLaporan = async (imgData = "") => {
        const newRef = push(ref(db, 'laporan_v2'));
        await set(newRef, {
            item, loc, desc, 
            phone: currentUserPhone, // Otomatis dari data login
            img: imgData,
            user: currentNick,
            time: Date.now()
        });
        resetForm();
        document.getElementById('btn-batal').click();
        tampilPesan("Berhasil diposting!");
    };

    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => pushLaporan(reader.result);
    } else {
        pushLaporan("");
    }
};

// --- LOGIKA LAINNYA ---
document.getElementById('search-input').oninput = (e) => renderData(e.target.value.toLowerCase());
document.getElementById('btn-buka-form').onclick = () => { resetForm(); document.getElementById('view-list').classList.add('hidden'); document.getElementById('view-form').classList.remove('hidden'); };
document.getElementById('btn-batal').onclick = () => { document.getElementById('view-form').classList.add('hidden'); document.getElementById('view-list').classList.remove('hidden'); };
document.getElementById('btn-login-action').onclick = () => prosesLogin(document.getElementById('login-id').value.toLowerCase(), document.getElementById('login-pass').value);
document.getElementById('btn-logout').onclick = () => { localStorage.clear(); location.reload(); };
window.hapusLaporan = (id) => tampilPesan("Hapus laporan ini?", true, async () => { await remove(ref(db, `laporan_v2/${id}`)); tampilPesan("Laporan dihapus."); });

// Reset Password Logic
document.getElementById('btn-forgot-password').onclick = () => document.getElementById('reset-modal').classList.remove('hidden');
document.getElementById('btn-send-otp').onclick = async () => {
    const email = document.getElementById('reset-email-input').value.trim();
    const usersSnap = await get(ref(db, 'users'));
    let found = false;
    usersSnap.forEach(c => { if(c.val().email.toLowerCase() === email.toLowerCase()) found = true; });
    if (!found) return tampilPesan("Email tidak terdaftar!");
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    emailjs.send("penemu", "template_laaee1i", { email, passcode: generatedOTP, time: new Date().toLocaleTimeString() })
    .then(() => { tampilPesan("OTP terkirim!"); document.getElementById('step-email').classList.add('hidden'); document.getElementById('step-otp').classList.remove('hidden'); })
    .catch(() => tampilPesan("Gagal kirim OTP. Cek Service ID!"));
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



