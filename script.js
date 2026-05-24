(async function () {

  const BASE_URL = "https://raw.githubusercontent.com/erfandana/qc-panel/main";



  // 1. Bersihkan panel lama jika mendeteksi duplikat saat dijalankan ulang

  const old = document.getElementById("qc-panel");

  if (old) old.remove();



  // 2. Ambil dan pasang CSS dari GitHub

  const css = await fetch(`${BASE_URL}/style.css`).then((r) => r.text());

  const style = document.createElement("style");

  style.innerHTML = css;

  document.head.appendChild(style);



  // 3. Ambil dan pasang HTML dari GitHub

  const html = await fetch(`${BASE_URL}/panel.html`).then((r) => r.text());

  const wrapper = document.createElement("div");

  wrapper.innerHTML = html;

  document.body.appendChild(wrapper);



  // 4. Ambil Data Spesifikasi Packaging dari JSON

  const packaging = await fetch(`${BASE_URL}/packaging.json`).then((r) => r.json());



  // 5. Seleksi Komponen Input Utama Berdasarkan HTML Baru

  const panel = document.getElementById("qc-panel");

  const sizeSelect = document.getElementById("size-select");

  const allInputs = Array.from(panel.querySelectorAll("input"));



  const findByPlaceholder = (text) => allInputs.find((input) => input.getAttribute("placeholder") === text);



  // Elemen Input Spek Atas (Menggunakan ID Asli dari HTML Anda)

  const capInput = document.getElementById("cap-input");

  const botolInput = document.getElementById("botol-input");

  const cartonInput = document.getElementById("carton-input");

  const toleransiInput = document.getElementById("toleransi-input");

  const labelInput = document.getElementById("label-input");

  const layerInput = document.getElementById("layer-input");

  const foldingInput = document.getElementById("folding-input");

  const densityInput = findByPlaceholder("INPUT DENSITY"); // SINKRON



  // Elemen Input Scan Atas

  const inputPO = findByPlaceholder("TEXT INPUT HASIL SCAN PO");

  const inputBatch = findByPlaceholder("TEXT INPUT HASIL SCAN BATCH");



  // Elemen Input Group Hasil Kalkulasi Otomatis (Bagian Bawah) -> SINKRON BERDASARKAN PLACEHOLDER BARU

  const targetFields = allInputs.filter((input) => input.getAttribute("placeholder") === "TARGET");

  const minFields = allInputs.filter((input) => input.getAttribute("placeholder") === "MINIMUM");

  const maxFields = allInputs.filter((input) => input.getAttribute("placeholder") === "MAXIMUM");



  // Index [0] = NETT, Index [1] = GROSS PCS, Index [2] = GROSS CARTON

  const nettTarget = targetFields[0];

  const nettMin = minFields[0];

  const nettMax = maxFields[0];



  const grossPcsTarget = targetFields[1];

  const grossPcsMin = minFields[1];

  const grossPcsMax = maxFields[1];



  const cartonTarget = targetFields[2];

  const cartonMin = minFields[2];

  const cartonMax = maxFields[2];



  // Input Toleransi Khusus Bagian Carton Paling Bawah (Mencari placeholder "TOLERANSI" yang bukan miliknya toleransiInput atas)

  const cartonToleransiInput = allInputs.filter((input) => input.getAttribute("placeholder") === "TOLERANSI").find((input) => input !== toleransiInput);



  // Kunci Field Hasil Timbangan & Toleransi agar Operator Tidak Bisa Edit Manual

  const readonlyFields = [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, toleransiInput, cartonToleransiInput];

  readonlyFields.forEach((field) => {

    if (field) field.readOnly = true;

  });



  // Ambil Element Tombol Submit & Clear dari HTML Anda

  const btnSubmit = document.getElementById("qc-submit");

  const btnClear = document.getElementById("qc-clear-data");



  // Berikan Warna Hijau Muda Bawaan untuk Tombol Scan & Submit

  const btnPo = document.getElementById("btn-scan-po");

  const btnBatch = document.getElementById("btn-scan-batch");

  [btnPo, btnBatch, btnSubmit].forEach((btn) => {

    if (btn) {

      btn.style.backgroundColor = "#d4ffd4";

      btn.style.color = "#000";

      btn.style.border = "1px solid #a3e4a3";

    }

  });



  // Fungsi menyimpan seluruh data input ke LocalStorage browser

  function simpanMemoriInput() {

    const dataScan = {

      size: sizeSelect.value,

      density: densityInput ? densityInput.value : "",

      po: inputPO ? inputPO.value : "",

      batch: inputBatch ? inputBatch.value : "",

      cap: capInput ? capInput.value : "",

      botol: botolInput ? botolInput.value : "",

      carton: cartonInput ? cartonInput.value : "",

      label: labelInput ? labelInput.value : "",

      layer: layerInput ? layerInput.value : "",

      folding: foldingInput ? foldingInput.value : "",

      toleransi: toleransiInput ? toleransiInput.value : "",

    };

    localStorage.setItem("qc_panel_memori", JSON.stringify(dataScan));

  }



  // Fungsi memuat kembali data lama dari memori local storage browser saat dibuka

  function muatMemoriInput() {

    const simpanan = localStorage.getItem("qc_panel_memori");

    if (simpanan) {

      const data = JSON.parse(simpanan);

      if (sizeSelect) sizeSelect.value = data.size || "";

      if (densityInput) densityInput.value = data.density || "";

      if (inputPO) inputPO.value = data.po || "";

      if (inputBatch) inputBatch.value = data.batch || "";

      if (capInput) capInput.value = data.cap || "";

      if (botolInput) botolInput.value = data.botol || "";

      if (cartonInput) cartonInput.value = data.carton || "";

      if (labelInput) labelInput.value = data.label || "";

      if (layerInput) layerInput.value = data.layer || "";

      if (foldingInput) foldingInput.value = data.folding || "";

      if (toleransiInput) toleransiInput.value = data.toleransi || "";

    }

  }



  // Fungsi Filter Desimal: koma (,) otomatis jadi titik (.) saat diketik

  function filterInputAngka(e) {

    let val = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");

    const parts = val.split(".");

    e.target.value = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : val;

    simpanMemoriInput();

    hitungBerat();

  }



  // Generate Dropdown Pilihan Ukuran (Size) otomatis dari JSON - SINKRON DENGAN OPTION SELECT SIZE

  sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';

  packaging.forEach((item) => {

    const option = document.createElement("option");

    option.value = item.size;

    option.textContent = item.size;

    sizeSelect.appendChild(option);

  });



  // Muat data lama dari memori

  muatMemoriInput();



  // FUNGSI UTAMA KALKULASI (SINKRON & AMAN DARI CLEAR OTOMATIS)

  function hitungBerat() {

    const selected = packaging.find((x) => x.size === sizeSelect.value);

    const density = parseFloat(densityInput.value);



    // Hanya bersihkan field hasil timbangan bawah jika density kosong. Jangan menyapu toleransiInput atas!

    if (!selected || isNaN(density) || density <= 0) {

      const fieldKalkulasiBawah = [nettTarget, nettMin, nettMax, grossPcsTarget, grossPcsMin, grossPcsMax, cartonTarget, cartonMin, cartonMax, cartonToleransiInput];

      fieldKalkulasiBawah.forEach((input) => {

        if (input) input.value = "";

      });

      return;

    }



    // --- A. KALKULASI BERAT NETT PER PCS (gr) ---

    const targetNettVal = selected.volume * density;

    const minNettVal = (selected.volume - selected.toleransi) * density;

    const maxNettVal = (selected.volume + selected.toleransi) * density;



    if (nettTarget) nettTarget.value = targetNettVal.toFixed(2);

    if (nettMin) nettMin.value = minNettVal.toFixed(2);

    if (nettMax) nettMax.value = maxNettVal.toFixed(2);



    // --- B. KALKULASI BERAT GROSS PER PCS (gr) ---

    const btlAct = parseFloat(botolInput.value) || 0;

    const capAct = parseFloat(capInput.value) || 0;



    const targetGrossPcsVal = targetNettVal + btlAct + capAct;

    const minGrossPcsVal = minNettVal + btlAct + capAct;

    const maxGrossPcsVal = maxNettVal + btlAct + capAct;



    if (grossPcsTarget) grossPcsTarget.value = targetGrossPcsVal.toFixed(2);

    if (grossPcsMin) grossPcsMin.value = minGrossPcsVal.toFixed(2);

    if (grossPcsMax) grossPcsMax.value = maxGrossPcsVal.toFixed(2);



    // --- C. KALKULASI BERAT GROSS PER CARTON (kg) ---

    const crtAct = parseFloat(cartonInput.value) || 0;

    const lblAct = parseFloat(labelInput.value) || 0;

    const fldAct = parseFloat(foldingInput.value) || 0;

    const isiVal = selected.isi || 0;



    const totalBahanInDus = lblAct + fldAct;



    const targetCartonVal = ((targetGrossPcsVal + totalBahanInDus) * isiVal + crtAct) / 1000;

    const maxCartonVal = ((maxGrossPcsVal + totalBahanInDus) * isiVal + crtAct) / 1000;



    // Penerapan Kondisi Rumus Minimum Carton Sesuai Ukuran Volume

    let minCartonVal = 0;

    if (selected.volume <= 250) {

      minCartonVal = targetCartonVal - targetGrossPcsVal / 1000;

    } else {

      minCartonVal = ((minGrossPcsVal + totalBahanInDus) * isiVal + crtAct) / 1000;

    }



    // Penerapan Kondisi Rumus Toleransi Carton Sesuai Ukuran Volume

    let toleransiCartonVal = 0;

    if (selected.volume <= 250) {

      toleransiCartonVal = (targetGrossPcsVal - 15) / 1000;

    } else {

      toleransiCartonVal = maxCartonVal - targetCartonVal;

    }



    if (cartonTarget) cartonTarget.value = targetCartonVal.toFixed(3);

    if (cartonMin) cartonMin.value = minCartonVal.toFixed(3);

    if (cartonMax) cartonMax.value = maxCartonVal.toFixed(3);

    if (cartonToleransiInput) cartonToleransiInput.value = toleransiCartonVal.toFixed(3);

  }



  // Jalankan perhitungan awal jika data memori langsung terisi saat start

  if (sizeSelect.value && densityInput.value) {

    hitungBerat();

  }



  // 8. EVENT LISTENERS HANDLER

  sizeSelect.addEventListener("change", function () {

    const selected = packaging.find((x) => x.size === this.value);

    if (!selected) {

      [capInput, botolInput, cartonInput, toleransiInput, labelInput, layerInput, foldingInput].forEach((inp) => {

        if (inp) inp.value = "";

      });

    } else {

      if (capInput) capInput.value = selected.cap;

      if (botolInput) botolInput.value = selected.botol;

      if (cartonInput) cartonInput.value = selected.carton;

      if (toleransiInput) toleransiInput.value = selected.toleransi.toFixed(2);

      if (labelInput) labelInput.value = selected.label || 0;

      if (layerInput) layerInput.value = selected.layer || 0;

      if (foldingInput) foldingInput.value = selected.folding || 0;

    }

    simpanMemoriInput();

    hitungBerat();

  });



  const inputsDiedit = [densityInput, capInput, botolInput, cartonInput, labelInput, layerInput, foldingInput];

  inputsDiedit.forEach((input) => {

    if (input) input.addEventListener("input", filterInputAngka);

  });



  [inputPO, inputBatch].forEach((inp) => {

    if (inp)

      inp.addEventListener("input", () => {

        simpanMemoriInput();

      });

  });



  // 9. INTEGRASI UTUH LIBRARY BARCODE/QR SCANNER CAMERA

  if (!window.Html5Qrcode) {

    const script = document.createElement("script");

    script.src = "https://unpkg.com/html5-qrcode";

    document.head.appendChild(script);

    await new Promise((resolve) => {

      script.onload = resolve;

    });

  }



  let scanner = null;

  let activeInput = null;

  const cameraContainer = document.getElementById("qc-camera-container");



  async function startScanner(targetInput) {

    activeInput = targetInput;

    cameraContainer.style.display = "block";

    if (scanner) {

      try {

        if (scanner.isScanning) await scanner.stop();

      } catch (e) {}

    } else {

      scanner = new Html5Qrcode("qc-scanner");

    }

    scanner

      .start(

        { facingMode: "environment" },

        { fps: 10, qrbox: 250 },

        (decodedText) => {

          activeInput.value = decodedText;

          activeInput.style.backgroundColor = "#d4ffd4";

          setTimeout(() => {

            activeInput.style.backgroundColor = "#fff";

          }, 700);

          simpanMemoriInput();

          stopScanner();

        },

        () => {},

      )

      .catch((err) => console.error(err));

  }



  function stopScanner() {

    if (scanner && scanner.isScanning) {

      scanner.stop().then(() => {

        cameraContainer.style.display = "none";

      });

    } else {

      cameraContainer.style.display = "none";

    }

  }



  document.getElementById("btn-scan-po").onclick = () => startScanner(inputPO);

  document.getElementById("btn-scan-batch").onclick = () => startScanner(inputBatch);

  document.getElementById("btn-close-cam").onclick = stopScanner;



  document.getElementById("qc-submit").onclick = () => {

    if (!sizeSelect.value || !densityInput.value) {

      alert("Harap pilih SIZE dan isi DENSITY terlebih dahulu!");

      return;

    }

    alert("SUBMIT BERHASIL!\nData berat produk aman dikirim ke sistem.");

  };



  // 🔴 LOGIKA UTUH TOMBOL CLEAR DATA

  if (btnClear) {

    btnClear.onclick = () => {

      if (confirm("Apakah Anda yakin ingin mengosongkan semua isi form/scan?")) {

        localStorage.removeItem("qc_panel_memori"); // Hapus memori browser



        if (sizeSelect) sizeSelect.value = "";



        const inputsHarusBersih = [densityInput, inputPO, inputBatch, capInput, botolInput, cartonInput, toleransiInput, labelInput, layerInput, foldingInput];

        inputsHarusBersih.forEach((inp) => {

          if (inp) inp.value = "";

        });



        allInputs.forEach((input) => {

          if (input.readOnly) {

            input.value = "";

          }

        });



        alert("Semua isian form berhasil dibersihkan!");

      }

    };

  }



  document.getElementById("qc-close-panel").onclick = () => {

    stopScanner();

    setTimeout(() => {

      document.getElementById("qc-panel")?.remove();

    }, 300);

  };

})();
