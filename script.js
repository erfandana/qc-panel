(async function () {

  // =========================
  // BASE GITHUB REPO
  // =========================
  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";

  // =========================
  // REMOVE OLD PANEL (Mencegah Duplikat)
  // =========================
  const old = document.getElementById("qc-panel");
  if (old) old.remove();

  // =========================
  // LOAD CSS
  // =========================
  const css = await fetch(`${BASE_URL}/style.css`).then(r => r.text());
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  // =========================
  // LOAD HTML
  // =========================
  const html = await fetch(`${BASE_URL}/panel.html`).then(r => r.text());
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // =========================
  // LOAD JSON DATA PACKAGING
  // =========================
  const packaging = await fetch(`${BASE_URL}/packaging.json`).then(r => r.json());

  // =========================
  // SELEKSI ELEMEN UTAMA
  // =========================
  const panel = document.getElementById("qc-panel");
  const sizeSelect = document.getElementById("size-select");
  const allInputs = Array.from(panel.querySelectorAll("input"));

  // Helper Fungsi: Mencari input berdasarkan teks placeholder-nya
  const findByPlaceholder = (text) => allInputs.find(input => input.getAttribute("placeholder") === text);

  // 1. Elemen Spek Packaging (Atas)
  const densityInput = findByPlaceholder("TEXT INPUT DENSITY");
  const capInput     = findByPlaceholder("TEXT INPUT CAP");
  const botolInput   = findByPlaceholder("TEXT INPUT BOTOL");
  const cartonInput  = findByPlaceholder("TEXT INPUT CARTON");
  
  // Deteksi khusus untuk input TOLERANSI spek (mencegah tertukar dengan toleransi carton)
  const toleransiInput = allInputs.find(input => 
    input.getAttribute("placeholder") === "TEXT INPUT TOLERANSI" || 
    input.previousElementSibling?.textContent.trim() === "TOLERANSI"
  );

  // 2. Elemen Scanner PO & Batch
  const inputPO    = findByPlaceholder("TEXT INPUT HASIL SCAN PO");
  const inputBatch = findByPlaceholder("TEXT INPUT HASIL SCAN BATCH");

  // 3. Elemen Group Berat (Masing-masing memiliki 3 baris input dengan placeholder sama)
  const targetFields = allInputs.filter(input => input.getAttribute("placeholder") === "DROPDOWN SIZE");
  const minFields    = allInputs.filter(input => input.getAttribute("placeholder") === "TEXT INPUT MINIMUM");
  const maxFields    = allInputs.filter(input => input.getAttribute("placeholder") === "TEXT INPUT MAXIMUM");

  // Mapping Array Filter ke Variabel Spesifik berdasarkan urutan Section di HTML
  const nettTarget = targetFields[0];
  const nettMin    = minFields[0];
  const nettMax    = maxFields[0];

  const grossPcsTarget = targetFields[1];
  const grossPcsMin    = minFields[1];
  const grossPcsMax    = maxFields[1];

  const cartonTarget = targetFields[2];
  const cartonMin    = minFields[2];
  const cartonMax    = maxFields[2];
  
  // Mengambil input toleransi paling bawah (Section Carton)
  const cartonToleransiInput = findByPlaceholder("TEXT INPUT TOLERANSI");

  // Kunci semua field kalkulasi agar menjadi Read-Only (Safety di Lapangan)
  const readonlyFields = [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax];
  readonlyFields.forEach(field => { if (field) field.readOnly = true; });

  // =========================
  // SETUP INITIAL DROPDOWN
  // =========================
  sizeSelect.innerHTML = '<option value="">DROPDOWN SIZE</option>';
  packaging.forEach(item => {
    const option = document.createElement("option");
    option.value = item.size;
    option.textContent = item.size;
    sizeSelect.appendChild(option);
  });

  // =========================
  // CORE LOGIC: KALKULASI BERAT OTOMATIS
  // =========================
  function hitungBerat() {
    const selected = packaging.find(x => x.size === sizeSelect.value);
    const density = parseFloat(densityInput.value);

    // Jika size belum dipilih atau density kosong/tidak valid, bersihkan semua form kalkulasi
    if (!selected || isNaN(density) || density <= 0) {
      const allCalcFields = [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax];
      allCalcFields.forEach(f => { if (f) f.value = ""; });
      return;
    }

    // --- 1. PERHITUNGAN BERAT NETT PER PCS (gr) ---
    // Aturan: Sesuai catatan, Kurung diselesaikan terlebih dahulu baru dikali density
    const targetNettVal = selected.volume * density;
    const minNettVal    = (selected.volume - selected.toleransi) * density;
    const maxNettVal    = (selected.volume + selected.toleransi) * density;

    if (nettTarget) nettTarget.value = targetNettVal.toFixed(2);
    if (nettMin)    nettMin.value    = minNettVal.toFixed(2);
    if (nettMax)    nettMax.value    = maxNettVal.toFixed(2);

    // --- 2. PERHITUNGAN BERAT GROSS PER PCS (gr) ---
    // Rumus: Berat Nett + Berat Botol + Berat Cap + Berat Label
    const targetGrossPcsVal = targetNettVal + selected.botol + selected.cap + selected.label;
    const minGrossPcsVal    = minNettVal + selected.botol + selected.cap + selected.label;
    const maxGrossPcsVal    = maxNettVal + selected.botol + selected.cap + selected.label;

    if (grossPcsTarget) grossPcsTarget.value = targetGrossPcsVal.toFixed(2);
    if (grossPcsMin)    grossPcsMin.value    = minGrossPcsVal.toFixed(2);
    if (grossPcsMax)    grossPcsMax.value    = maxGrossPcsVal.toFixed(2);

    // --- 3. PERHITUNGAN BERAT GROSS PER CARTON (kg) ---
    // Rumus: ((Gross Pcs * Isi) + Berat Carton) / 1000 -> Konversi ke Kg
    const targetCartonVal   = ((targetGrossPcsVal * selected.isi) + selected.carton) / 1000;
    const toleransiCartonVal = (selected.toleransi * selected.layer) / 1000;
    const minCartonVal      = targetCartonVal - toleransiCartonVal;
    const maxCartonVal      = targetCartonVal + toleransiCartonVal;

    if (cartonTarget)         cartonTarget.value         = targetCartonVal.toFixed(3);
    if (cartonMin)            cartonMin.value            = minCartonVal.toFixed(3);
    if (cartonMax)            cartonMax.value            = maxCartonVal.toFixed(3);
    if (cartonToleransiInput) cartonToleransiInput.value = toleransiCartonVal.toFixed(3);
  }

  // =========================
  // EVENT LISTENERS HANDLER
  // =========================
  
  // Trigger ketika Dropdown Size Berubah
  sizeSelect.addEventListener("change", function () {
    const selected = packaging.find(x => x.size === this.value);
    
    if (!selected) {
      if (capInput)       capInput.value = "";
      if (botolInput)     botolInput.value = "";
      if (cartonInput)    cartonInput.value = "";
      if (toleransiInput) toleransiInput.value = "";
    } else {
      if (capInput)       capInput.value = selected.cap;
      if (botolInput)     botolInput.value = selected.botol;
      if (cartonInput)    cartonInput.value = selected.carton;
      if (toleransiInput) toleransiInput.value = selected.toleransi; // Ambil Toleransi Langsung Dari JSON
    }
    // Jalankan kalkulasi ulang
    hitungBerat();
  });

  // Trigger ketika Nilai Density Diketik Manual
  if (densityInput) {
    densityInput.addEventListener("input", hitungBerat);
  }

  // =========================
  // INTEGRASI LIBRARY QR CODE SCANNER
  // =========================
  if (!window.Html5Qrcode) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    document.head.appendChild(script);
    await new Promise(resolve => { script.onload = resolve; });
  }

  let scanner = null;
  let activeInput = null;
  const cameraContainer = document.getElementById("qc-camera-container");

  async function startScanner(targetInput) {
    activeInput = targetInput;
    cameraContainer.style.display = "block";

    if (scanner) {
      try { if (scanner.isScanning) await scanner.stop(); } catch (e) {}
    } else {
      scanner = new Html5Qrcode("qc-scanner");
    }

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        activeInput.value = decodedText;
        activeInput.style.backgroundColor = "#d4ffd4"; // Flash Hijau tanda sukses scan
        setTimeout(() => { activeInput.style.backgroundColor = "#fff"; }, 700);
        stopScanner();
      },
      () => {}
    ).catch(err => console.error("Kamera gagal diakses:", err));
  }

  function stopScanner() {
    if (scanner && scanner.isScanning) {
      scanner.stop().then(() => { cameraContainer.style.display = "none"; });
    } else {
      cameraContainer.style.display = "none";
    }
  }

  // Bind Event ke Tombol-Tombol Aksi HTML
  document.getElementById("btn-scan-po").onclick    = () => startScanner(inputPO);
  document.getElementById("btn-scan-batch").onclick = () => startScanner(inputBatch);
  document.getElementById("btn-close-cam").onclick   = stopScanner;

  // Submit Handler
  document.getElementById("qc-submit").onclick = () => {
    if (!sizeSelect.value || !densityInput.value) {
      alert("⚠️ Harap pilih SIZE dan isi nilai DENSITY terlebih dahulu!");
      return;
    }
    alert("✅ SUBMIT BERHASIL!\nData timbangan berat produk telah dikalkulasi sempurna.");
  };

  // Close Panel Handler
  document.getElementById("qc-close-panel").onclick = () => {
    stopScanner();
    setTimeout(() => { document.getElementById("qc-panel")?.remove(); }, 300);
  };

})();
