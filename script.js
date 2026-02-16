import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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
const dbRef = ref(db, 'laporan_v2');

// Navigasi UI
const toggleUI = () => {
    document.getElementById('view-list').classList.toggle('hidden');
    document.getElementById('view-form').classList.toggle('hidden');
};

// Fungsi Kompres & Konversi Gambar ke Base64 (Teks)
const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// Fungsi Kirim Data
const kirimLaporan = async () => {
    const nama = document.getElementById('nama-barang').value;
    const lokasi = document.getElementById('lokasi-barang').value;
    const fileInput = document.getElementById('foto-barang');
    const btn = document.getElementById('btn-posting');

    if (!nama || !lokasi) return alert("Nama dan Lokasi wajib diisi!");

    btn.disabled = true;
    btn.innerText = "Sedang Memposting...";

    try {
        let base64String = "";
        if (fileInput.files.length > 0) {
            base64String = await convertToBase64(fileInput.files[0]);
        }

        await push(dbRef, {
            nama: nama,
            lokasi: lokasi,
            gambar: base64String,
            waktu: new Date().toLocaleString('id-ID')
        });

        alert("Berhasil Terposting!");
        document.getElementById('nama-barang').value = "";
        document.getElementById('lokasi-barang').value = "";
        fileInput.value = "";
        toggleUI();
    } catch (error) {
        alert("Gagal: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Posting Sekarang";
    }
};

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-buka-form').onclick = toggleUI;
    document.getElementById('btn-batal').onclick = toggleUI;
    document.getElementById('btn-posting').onclick = kirimLaporan;

    // Tampilkan data Real-time
    onValue(dbRef, (snapshot) => {
        const listContainer = document.getElementById('item-list');
        listContainer.innerHTML = "";
        const data = snapshot.val();

        if (data) {
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                listContainer.innerHTML += `
                    <div class="card">
                        ${item.gambar ? `<img src="${item.gambar}">` : ""}
                        <strong>📦 ${item.nama}</strong><br>
                        <small>📍 ${item.lokasi}</small><br>
                        <i style="font-size: 11px; color: gray;">${item.waktu}</i>
                    </div>`;
            });
        } else {
            listContainer.innerHTML = "<p style='text-align:center;'>Belum ada laporan barang.</p>";
        }
    });
});
