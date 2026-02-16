// Fungsi memunculkan/menutup form
function toggleForm() {
    const form = document.getElementById('form-section');
    const list = document.getElementById('list-section');
    form.classList.toggle('hidden');
    list.classList.toggle('hidden');
}

// Fungsi menyimpan data
function saveItem() {
    const nama = document.getElementById('input-nama').value;
    const lokasi = document.getElementById('input-lokasi').value;
    const fotoInput = document.getElementById('input-foto');

    if (nama === "" || lokasi === "") {
        alert("Mohon isi semua data!");
        return;
    }

    // Mengambil file gambar
    const file = fotoInput.files[0];
    const reader = new FileReader();

    reader.onloadend = function() {
        const item = {
            id: Date.now(),
            nama: nama,
            lokasi: lokasi,
            foto: reader.result || 'https://via.placeholder.com/60'
        };

        // Simpan ke LocalStorage (Database sementara di Browser)
        let items = JSON.parse(localStorage.getItem('lostFoundItems')) || [];
        items.push(item);
        localStorage.setItem('lostFoundItems', JSON.stringify(items));

        renderItems();
        toggleForm();
        clearInput();
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        reader.onloadend(); // Jika tidak ada foto
    }
}

// Fungsi menampilkan daftar barang
function renderItems() {
    const listContainer = document.getElementById('item-list');
    const items = JSON.parse(localStorage.getItem('lostFoundItems')) || [];

    if (items.length === 0) {
        listContainer.innerHTML = '<p class="empty-msg">Belum ada barang yang dilaporkan.</p>';
        return;
    }

    listContainer.innerHTML = items.map(item => `
        <div class="card">
            <img src="${item.foto}" alt="foto">
            <div>
                <strong>${item.nama}</strong><br>
                <small>📍 ${item.lokasi}</small>
            </div>
        </div>
    `).reverse().join('');
}

function clearInput() {
    document.getElementById('input-nama').value = "";
    document.getElementById('input-lokasi').value = "";
    document.getElementById('input-foto').value = "";
}

// Jalankan saat pertama kali buka
renderItems();