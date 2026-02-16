import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Fungsi Toggle (Buka/Tutup Form)
window.toggleForm = () => {
    document.getElementById('form-section').classList.toggle('hidden');
    document.getElementById('list-section').classList.toggle('hidden');
}

// Fungsi Simpan ke Firebase
window.saveItem = () => {
    const nama = document.getElementById('input-nama').value;
    const lokasi = document.getElementById('input-lokasi').value;

    if (nama && lokasi) {
        push(ref(db, 'items'), {
            nama: nama,
            lokasi: lokasi,
            waktu: new Date().toLocaleTimeString()
        }).then(() => {
            alert("Berhasil Terkirim!");
            document.getElementById('input-nama').value = "";
            document.getElementById('input-lokasi').value = "";
            window.toggleForm();
        });
    } else {
        alert("Lengkapi data!");
    }
}

// Menampilkan Data Secara Otomatis (Real-time)
onValue(ref(db, 'items'), (snapshot) => {
    const list = document.getElementById('item-list');
    const data = snapshot.val();
    list.innerHTML = "";
    if (data) {
        Object.keys(data).reverse().forEach(key => {
            const item = data[key];
            list.innerHTML += `
                <div class="card" style="border:1px solid #ddd; padding:10px; margin:10px; border-radius:10px;">
                    <strong>📦 ${item.nama}</strong><br>
                    <small>📍 ${item.lokasi} | 🕒 ${item.waktu}</small>
                </div>`;
        });
    }
});
