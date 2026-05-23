(async function () {

  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";

  // 1. Bersihkan panel lama jika mendeteksi duplikat
  const old = document.getElementById("qc-panel");
  if (old) old.remove();

  // 2. Ambil dan pasang CSS
  const css = await fetch(`${BASE_URL}/style.css`).then(r => r.text());
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  // 3. Ambil dan pasang HTML
  const html = await fetch(`${BASE_URL}/panel.html`).then(r => r.text());
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // 4. Ambil Data Spesifikasi Packaging dari JSON
  const packaging = await fetch(`${BASE_URL}/packaging.json`).then(r => r.json());

  // 5. Seleksi Komponen Input Utama
  const panel = document.getElementById("qc-panel");
  const sizeSelect = document.getElementById("size-select");
  const allInputs = Array.from(panel.querySelectorAll("input"));

  const findByPlaceholder = (text) => allInputs.find(input => input.getAttribute("placeholder") === text);

  // Elemen Input Spek Atas
  const capInput     = findByPlaceholder("TEXT INPUT CAP");
  const botolInput   = findByPlaceholder("TEXT INPUT BOTOL");
  const cartonInput  = findByPlaceholder("TEXT INPUT CARTON");
  const densityInput = findByPlaceholder("TEXT INPUT DENSITY");
  
  const toleransiInput = allInputs.find(input => 
    input.getAttribute("placeholder") === "TEXT INPUT TOLERANSI" || 
    input.previousElementSibling?.textContent.trim() === "TOLERANSI"
  );

  // Elemen Input Group Hasil Kalkulasi (Target, Min, Max)
  const targetFields = allInputs.filter(input => input.getAttribute("placeholder") === "DROPDOWN SIZE");
  const minFields    = allInputs.filter(input => input.getAttribute("placeholder") === "TEXT INPUT MINIMUM");
  const maxFields    = allInputs.filter(input => input.getAttribute("placeholder") === "TEXT INPUT MAXIMUM");

  const nettTarget = targetFields[0];
  const nettMin    = minFields[0];
  const nettMax    = maxFields[0];

  const grossPcsTarget = targetFields[1];
  const grossPcsMin    = minFields[1];
  const grossPcsMax    = maxFields[1];

  const cartonTarget = targetFields[2];
  const cartonMin    = minFields[2];
  const cartonMax    = maxFields[2];
  
  // Input Toleransi Khusus Bagian Carton (Bawah)
  const cartonToleransiInput = findByPlaceholder("TEXT INPUT TOLERANSI");

  // Kunci Field Hasil Timbangan agar operator tidak bisa input manual
  const readonlyFields = [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, cartonToleransiInput];
  readonlyFields.forEach(field => { if (field) field.readOnly = true; });

  // 6. Setup Isi Dropdown Pilihan Size
  sizeSelect.innerHTML = '<option value="">DROPDOWN SIZE</option>';
  packaging.forEach(item => {
    const option = document.createElement("option");
    option.value = item.size;
    option.textContent = item.size;
    sizeSelect.appendChild(option);
  });

  // 7. FUNGSI UTAMA KALKULASI BERAT (Sesuai Versi Code Pilihan Anda)
  function hitungBerat() {
    const selected = packaging.find(x => x.size === sizeSelect.value);
    const density = parseFloat(densityInput.value);

    if (!selected || isNaN(density) || density <= 0) {
      readonlyFields.forEach(f => { if (f) f.value = ""; });
      return;
    }

    // --- A. KALKULASI BERAT NETT PER PCS (gr) ---
    const targetNettVal = selected.volume * density;
    const minNettVal    = (selected.volume - selected.toleransi) * density;
    const maxNettVal    = (selected.volume + selected.toleransi) * density;

    if (nettTarget) nettTarget.value = targetNettVal.toFixed(2);
    if (nettMin)    nettMin.value    = minNettVal.toFixed(2);
    if (nettMax)    nettMax.value    = maxNettVal.toFixed(2);

    // --- B. KALKULASI BERAT GROSS PER PCS (gr) ---
    const btlAct = parseFloat(botolInput.value) || 0;
    const capAct = parseFloat(capInput.value) || 0;

    const targetGrossPcsVal = targetNettVal + btlAct + capAct;
    const minGrossPcsVal    = minNettVal + btlAct + capAct;
    const maxGrossPcsVal    = maxNettVal + btlAct + capAct;

    if (grossPcsTarget) grossPcsTarget.value = targetGrossPcsVal.toFixed(2);
    if (grossPcsMin)    grossPcsMin.value    = minGrossPcsVal.toFixed(2);
    if (grossPcsMax)    grossPcsMax.value    = maxGrossPcsVal.toFixed(2);

    // --- C. KALKULASI BERAT GROSS PER CARTON (kg) ---
    const crtAct = parseFloat(cartonInput.value) || 0;
    const isiVal = selected.isi || 0;

    const targetCartonVal   = ((targetGrossPcsVal * isiVal) + crtAct) / 1000;
    const toleransiCartonVal = (selected.toleransi * selected.layer) / 1000;
    
    const minCartonVal      = targetCartonVal - toleransiCartonVal;
    const maxCartonVal      = targetCartonVal + toleransiCartonVal;

    if (cartonTarget)         cartonTarget.value         = targetCartonVal.toFixed(3);
    if (cartonMin)            cartonMin.value            = minCartonVal.toFixed(3);
    if (cartonMax)            cartonMax.value            = maxCartonVal.toFixed(3);
    if (cartonToleransiInput) cartonToleransiInput.value = toleransiCartonVal.toFixed(3);
  }

  // 8. EVENT LISTENERS HANDLER
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
      if (toleransiInput) toleransiInput.value = selected.toleransi; // Auto-load spek toleransi atas
    }
    hitungBerat();
  });

  // Pemicu hitung ulang real-time jika spek diedit manual oleh user
  if (densityInput) densityInput.addEventListener("input", hitungBerat);
  if (capInput)     capInput.addEventListener("input", hitungBerat);
  if (botolInput)   botolInput.addEventListener("input", hitungBerat);
  if (cartonInput)  cartonInput.addEventListener("input", hitungBerat);

  // 9. INTEGRASI UTUH LIBRARY QR BARCODE SCANNER
  if (!window.Html5Qrcode) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    document.head.appendChild(script);
    await new Promise(resolve => { script.onload = resolve; });
  }

  let scanner = null;
  let activeInput = null;
  const cameraContainer = document.getElementById("qc-camera-container");
  const inputPO    = findByPlaceholder("TEXT INPUT HASIL SCAN PO");
  const inputBatch = findByPlaceholder("TEXT INPUT HASIL SCAN BATCH");

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
        activeInput.style.backgroundColor = "#d4ffd4";
        setTimeout(() => { activeInput.style.backgroundColor = "#fff"; }, 700);
        stopScanner();
      },
      () => {}
    ).catch(err => console.error(err));
  }

  function stopScanner() {
    if (scanner && scanner.isScanning) {
      scanner.stop().then(() => { cameraContainer.style.display = "none"; });
    } else {
      cameraContainer.style.display = "none";
    }
  }

  document.getElementById("btn-scan-po").onclick    = () => startScanner(inputPO);
  document.getElementById("btn-scan-batch").onclick = () => startScanner(inputBatch);
  document.getElementById("btn-close-cam").onclick   = stopScanner;

  // Submit Data Handler
  document.getElementById("qc-submit").onclick = () => {
    if (!sizeSelect.value || !densityInput.value) {
      alert("Harap pilih SIZE dan isi DENSITY terlebih dahulu!");
      return;
    }
    alert("SUBMIT BERHASIL!\nData berat produk siap dikirim ke sistem.");
  };

  // Close Panel Handler
  document.getElementById("qc-close-panel").onclick = () => {
    stopScanner();
    setTimeout(() => { document.getElementById("qc-panel")?.remove(); }, 300);
  };

})();
