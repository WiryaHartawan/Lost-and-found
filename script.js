import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Konfigurasi Firebase Kamu
const firebaseConfig = {
    apiKey: "AIzaSyBw9bZb08ux2Ft2ywM4Kygo3-FYEfWD-6I",
    authDomain: "lostfound-927df.firebaseapp.com",
    projectId: "lostfound-927df",
    databaseURL: "https://lostfound-927df-default-rtdb.asia-southeast1.firebasedatabase.app",
    storageBucket: "lostfound-927df.firebasestorage.app",
    messagingSenderId: "659071189789",
    appId: "1:659071189789:web:f83742d4fb804b175a57f4"
};

// 2. Inisialisasi
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const barangRef = ref(db, 'items');

// --- FUNGSI UI (Buka/Tutup Form) ---
const toggleTampilan = () => {
    document.getElementById('form-section').classList.toggle('hidden');
    document.getElementById('list-section').classList.toggle('hidden');
};

// --- FUNGSI SIMPAN DATA ---
const simpanKeFirebase = () => {
    const nama = document.getElementById('input-nama').value;
    const lokasi = document.getElementById('input-lokasi').value;

    if (nama.trim() && lokasi.trim()) {
        push(barangRef, {
            nama: nama,
            lokasi: lokasi,
            waktu: new Date().toLocaleString('id-ID')
        }).then(() => {
            alert("Berhasil dilaporkan!");
            document.getElementById('input-nama').value = "";
            document.getElementById('input-lokasi').value = "";
            toggleTampilan();
        }).catch((err) => alert("Gagal: " + err.message));
    } else {
        alert("Mohon isi semua kolom!");
    }
};

// --- TAMPILKAN DATA SECARA REAL-TIME ---
onValue(barangRef, (snapshot) => {
    const listContainer = document.getElementById('item-list');
    const data = snapshot.val();
    listContainer.innerHTML = "";

    if (data) {
        Object.keys(data).reverse().forEach(id => {
            const item = data[id];
            const element = `
                <div class="card">
                    <strong>📦 ${item.nama}</strong>
                    <p>📍 ${item.lokasi}</p>
                    <small>${item.waktu}</small>
                </div>
            `;
            listContainer.innerHTML += element;
        });
    } else {
        listContainer.innerHTML = "<p>Belum ada barang dilaporkan.</p>";
    }
});

// --- PASANG EVENT LISTENER (Pengganti onclick) ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-buka-form').addEventListener('click', toggleTampilan);
    document.getElementById('btn-batal').addEventListener('click', toggleTampilan);
    document.getElementById('btn-simpan').addEventListener('click', simpanKeFirebase);
});
