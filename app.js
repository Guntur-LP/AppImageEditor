const upload = document.getElementById('upload');
const grayscaleBtn = document.getElementById('grayscale');
const blurBtn = document.getElementById('blur');
const goBackBtn = document.getElementById('goBack');
const downloadBtn = document.getElementById('download'); // Tombol Download Image
const originalCanvas = document.getElementById('originalCanvas');
const editedCanvas = document.getElementById('editedCanvas');

const originalCtx = originalCanvas.getContext('2d');
const editedCtx = editedCanvas.getContext('2d');

// Tetapkan ukuran canvas (box)
const canvasWidth = 500; // Lebar tetap
const canvasHeight = 500; // Tinggi tetap
originalCanvas.width = canvasWidth;
originalCanvas.height = canvasHeight;
editedCanvas.width = canvasWidth;
editedCanvas.height = canvasHeight;

let img = new Image();
let history = []; // Stack untuk menyimpan state gambar sebelumnya

upload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

img.onload = () => {
    const { width: imgWidth, height: imgHeight } = img;

    // Hitung skala agar gambar sesuai dengan ukuran box
    const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const newWidth = imgWidth * scale;
    const newHeight = imgHeight * scale;

    // Hapus canvas sebelumnya
    originalCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    editedCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Gambar ulang dengan ukuran yang disesuaikan
    const offsetX = (canvasWidth - newWidth) / 2; // Pusatkan horizontal
    const offsetY = (canvasHeight - newHeight) / 2; // Pusatkan vertikal

    originalCtx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
    editedCtx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

    // Reset history
    history = []; 
    saveState(); // Simpan state awal
};

const saveState = () => {
    // Simpan state canvas dalam history
    const currentData = editedCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    history.push(currentData);
};

grayscaleBtn.addEventListener('click', () => {
    saveState(); // Simpan state sebelum perubahan
    const imageData = editedCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;       // Red
        data[i + 1] = avg;   // Green
        data[i + 2] = avg;   // Blue
    }

    editedCtx.putImageData(imageData, 0, 0);
});

blurBtn.addEventListener('click', () => {
    saveState(); // Simpan state sebelum perubahan
    const imageData = editedCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const blurKernel = (x, y, data, width, height) => {
        let r = 0, g = 0, b = 0, count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
                    const index = (ny * width + nx) * 4;
                    r += data[index];
                    g += data[index + 1];
                    b += data[index + 2];
                    count++;
                }
            }
        }
        return [r / count, g / count, b / count];
    };

    const blurredData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const [r, g, b] = blurKernel(x, y, data, width, height);
            blurredData[index] = r;
            blurredData[index + 1] = g;
            blurredData[index + 2] = b;
        }
    }

    for (let i = 0; i < data.length; i++) {
        data[i] = blurredData[i];
    }

    editedCtx.putImageData(imageData, 0, 0);
});

goBackBtn.addEventListener('click', () => {
    if (history.length > 1) {
        // Kembalikan state terakhir
        history.pop(); // Hapus state terkini
        const previousState = history[history.length - 1];
        editedCtx.putImageData(previousState, 0, 0);
    } else {
        alert("No more steps to undo!");
    }
});

// Tombol untuk download gambar yang telah diedit
downloadBtn.addEventListener('click', () => {
    const dataUrl = editedCanvas.toDataURL("image/png"); // Mengonversi canvas ke image
    const link = document.createElement('a'); // Membuat elemen anchor untuk download
    link.href = dataUrl; // Mengatur link untuk download
    link.download = 'edited-image.png'; // Nama file yang akan diunduh
    link.click(); // Memicu unduhan
});
