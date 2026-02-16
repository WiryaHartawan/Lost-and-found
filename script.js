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

// --- FUNGSI KOMPRESI & BASE64 ---
const processImage = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Perkecil dimensi jika terlalu besar (max 1200px)
                const max_size = 1200;
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Kualitas 0.7 (70%) agar ukuran file teks Base64 ramping
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
        };
    });
};

// --- LOGIKA UI ---
const toggleUI = () => {
    document.getElementById('view-list').classList.toggle('hidden');
    document.getElementById('view-form').classList.toggle('hidden');
};

const kirimLaporan = async () => {
    const nama = document.getElementById('nama-barang').value;
    const lokasi = document.getElementById('lokasi-barang').value;
    const fileInput = document.getElementById('foto-barang');
    const file = fileInput.files[0];
    const btn = document.getElementById('btn-posting');

    if (!nama || !lokasi) return alert("Nama dan Lokasi wajib diisi!");

    // --- CEK LIMIT 5MB ---
    if (file) {
        const limitMB = 5;
        if (file.size > limitMB * 1024 * 1024) {
            alert(`File terlalu besar! Maksimal ${limitMB}MB.`);
            return;
        }
    }

    btn.disabled = true;
    btn.innerText = "Sedang Memposting...";

    try {
        let base64String = "";
        if (file) {
            base64String = await processImage(file);
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
        console.error(error);
        alert("Gagal memposting. Cek koneksi internet.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Posting Sekarang";
    }
};

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-buka-form').onclick = toggleUI;
    document.getElementById('btn-batal').onclick = toggleUI;
    document.getElementById('btn-posting').onclick = kirimLaporan;

    onValue(dbRef, (snapshot) => {
        const listContainer = document.getElementById('item-list');
        listContainer.innerHTML = "";
        const data = snapshot.val();

        if (data) {
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                listContainer.innerHTML += `
                    <div class="card">
                        ${item.gambar ? `<img src="${item.gambar}" loading="lazy">` : ""}
                        <div style="padding: 10px;">
                            <strong>📦 ${item.nama}</strong><br>
                            <small>📍 ${item.lokasi}</small><br>
                            <i style="font-size: 11px; color: gray;">${item.waktu}</i>
                        </div>
                    </div>`;
            });
        } else {
            listContainer.innerHTML = "<p style='text-align:center;'>Belum ada laporan barang.</p>";
        }
    });
});
