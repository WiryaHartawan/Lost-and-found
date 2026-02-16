// 1. Import library Firebase yang dibutuhkan
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. Konfigurasi Firebase (PASTIKAN COPY-PASTE DARI CONSOLE FIREBASE-MU)
const firebaseConfig = {
  apiKey: "AIzaSyBw9bZb08ux2Ft2ywM4Kygo3-FYEfWD-6I",
  authDomain: "lostfound-927df.firebaseapp.com",
  projectId: "lostfound-927df",
  // Masukkan databaseURL jika belum ada (cek di tab Realtime Database)
  databaseURL: "https://lostfound-927df-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "lostfound-927df.firebasestorage.app",
  messagingSenderId: "659071189789",
  appId: "1:659071189789:web:f83742d4fb804b175a57f4"
};

// 3. Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- FUNGSI-FUNGSI UTAMA ---

/**
 * FUNGSI: toggleForm
 * Digunakan untuk membuka/menutup form input barang.
 * Kita pakai window. agar bisa dipanggil oleh onclick di HTML.
 */
window.toggleForm = function() {
    const form = document.getElementById('form-section');
    const list = document.getElementById('list-section');
    
    // Logika switch tampilan (hidden/show)
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        list.classList.add('hidden');
    } else {
        form.classList.add('hidden');
        list.classList.remove('hidden');
    }
}

/**
 * FUNGSI: saveItem
 * Digunakan untuk mengirim data ke database Firebase.
 */
window.saveItem = function() {
    const nama = document.getElementById('input-nama').value;
    const lokasi = document.getElementById('input-lokasi').value;

    // Validasi sederhana: jangan biarkan kosong
    if (nama.trim() === "" || lokasi.trim() === "") {
        alert("Mohon isi nama barang dan lokasi!");
        return;
    }

    // Kirim data ke node 'barang' di Firebase
    push(ref(db, 'barang'), {
        nama: nama,
        lokasi: lokasi,
        waktu: Date.now() // Simpan waktu penginputan
    })
    .then(() => {
        alert("Barang berhasil dilaporkan!");
        // Reset input setelah berhasil
        document.getElementById('input-nama').value = "";
        document.getElementById('input-lokasi').value = "";
        // Kembali ke tampilan list
        window.toggleForm();
    })
    .catch((error) => {
        console.error("Gagal simpan data:", error);
        alert("Terjadi kesalahan saat menyimpan data.");
    });
}

/**
 * LISTENER: onValue
 * Fungsi ini otomatis berjalan setiap kali ada data baru di Firebase.
 * Ini yang bikin aplikasi kamu jadi Real-Time.
 */
onValue(ref(db, 'barang'), (snapshot) => {
    const listContainer = document.getElementById('item-list');
    const data = snapshot.val();
    
    // Kosongkan container sebelum diisi data baru
    listContainer.innerHTML = "";

    if (data) {
        // Ambil ID barang, balik urutannya (supaya yang terbaru di atas)
        const keys = Object.keys(data).reverse();
        
        keys.forEach(id => {
            const item = data[id];
            
            // Buat tampilan kartu barang
            const card = `
                <div class="card" style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 8px;">
                    <div style="font-weight: bold; color: #333;">📦 ${item.nama}</div>
                    <div style="font-size: 0.9em; color: #666;">📍 Lokasi: ${item.lokasi}</div>
                </div>
            `;
            listContainer.innerHTML += card;
        });
    } else {
        listContainer.innerHTML = '<p style="text-align:center; color:#999;">Belum ada barang yang ditemukan.</p>';
    }
});
