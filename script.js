// Import fungsi yang dibutuhkan dari Firebase SDK terbaru
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Konfigurasi milikmu
const firebaseConfig = {
    apiKey: "AIzaSyBw9bZb08ux2Ft2ywM4Kygo3-FYEfWD-6I",
    authDomain: "lostfound-927df.firebaseapp.com",
    projectId: "lostfound-927df",
    // TAMBAHKAN baris databaseURL di bawah ini (cek di console Firebase bagian Realtime Database)
    databaseURL: "https://lostfound-927df-default-rtdb.asia-southeast1.firebasedatabase.app", 
    storageBucket: "lostfound-927df.firebasestorage.app",
    messagingSenderId: "659071189789",
    appId: "1:659071189789:web:f83742d4fb804b175a57f4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Fungsi Simpan Data (Panggil dari tombol posting kamu)
window.saveItem = function() {
    const nama = document.getElementById('input-nama').value;
    const lokasi = document.getElementById('input-lokasi').value;

    if(nama && lokasi) {
        push(ref(db, 'barang'), {
            nama: nama,
            lokasi: lokasi,
            waktu: Date.now()
        });
        
        alert("Berhasil diposting!");
        // Tambahkan fungsi untuk menutup form kamu di sini
        document.getElementById('input-nama').value = "";
        document.getElementById('input-lokasi').value = "";
    } else {
        alert("Isi semua data dulu ya!");
    }
}

// Menampilkan Data secara Real-Time (Otomatis update saat ada data baru)
onValue(ref(db, 'barang'), (snapshot) => {
    const data = snapshot.val();
    const listContainer = document.getElementById('item-list');
    listContainer.innerHTML = ""; // Bersihkan tampilan lama

    if (data) {
        // Balik urutan agar yang terbaru di atas
        Object.keys(data).reverse().forEach(id => {
            const item = data[id];
            listContainer.innerHTML += `
                <div class="card">
                    <div class="info">
                        <strong>📦 ${item.nama}</strong><br>
                        <small>📍 Lokasi: ${item.lokasi}</small>
                    </div>
                </div>
            `;
        });
    } else {
        listContainer.innerHTML = "<p>Belum ada barang ditemukan.</p>";
    }
});
