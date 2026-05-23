(async function () {

  // =========================
  // BASE GITHUB REPO
  // =========================

  const BASE_URL =
    "https://raw.githubusercontent.com/erfandana/qc-panel/main";

  // =========================
  // REMOVE OLD PANEL
  // =========================

  const old =
    document.getElementById("qc-panel");

  if (old) old.remove();

  // =========================
  // LOAD CSS
  // =========================

  const css =
    await fetch(`${BASE_URL}/style.css`).then(r => r.text());

  const style =
    document.createElement("style");

  style.innerHTML = css;

  document.head.appendChild(style);

  // =========================
  // LOAD HTML
  // =========================

  const html =
    await fetch(`${BASE_URL}/panel.html`).then(r => r.text());

  const wrapper =
    document.createElement("div");

  wrapper.innerHTML = html;

  document.body.appendChild(wrapper);

  // =========================
  // LOAD JSON
  // =========================

  const packaging =
    await fetch(`${BASE_URL}/packaging.json`).then(r => r.json());

  // =========================
  // ELEMENTS
  // =========================

  const sizeSelect =
    document.getElementById("size-select");

  const capInput =
    document.getElementById("cap-input");

  const botolInput =
    document.getElementById("botol-input");

  const cartonInput =
    document.getElementById("carton-input");

  const toleransiInput =
    document.getElementById("toleransi-input");

  // =========================
  // FILL DROPDOWN
  // =========================

  packaging.forEach(item => {

    const option =
      document.createElement("option");

    option.value = item.size;
    option.textContent = item.size;

    sizeSelect.appendChild(option);

  });

  // =========================
  // ON CHANGE SIZE
  // =========================

  sizeSelect.addEventListener("change", function () {

    const selected =
      packaging.find(x => x.size === this.value);

    if (!selected) return;

    capInput.value = selected.cap;
    botolInput.value = selected.botol;
    cartonInput.value = selected.carton;
    toleransiInput.value = selected.toleransi;

  });

  // =========================
  // LOAD QR LIB
  // =========================

  if (!window.Html5Qrcode) {

    const script =
      document.createElement("script");

    script.src =
      "https://unpkg.com/html5-qrcode";

    document.head.appendChild(script);

    await new Promise(resolve => {
      script.onload = resolve;
    });
  }

  // =========================
  // SCANNER
  // =========================

  let scanner = null;
  let activeInput = null;
  let isStopping = false;

  const cameraContainer =
    document.getElementById("qc-camera-container");

  const inputPO =
    document.getElementById("input-scan-po");

  const inputBatch =
    document.getElementById("input-scan-batch");

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

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {

        activeInput.value = decodedText;

        activeInput.style.backgroundColor = "#d4ffd4";

        setTimeout(() => {
          activeInput.style.backgroundColor = "#fff";
        }, 700);

        stopScanner();
      },
      () => {}
    );
  }

  function stopScanner() {

    if (scanner && scanner.isScanning) {

      isStopping = true;

      scanner.stop().then(() => {
        cameraContainer.style.display = "none";
        isStopping = false;
      });

    } else {
      cameraContainer.style.display = "none";
    }
  }

  // =========================
  // EVENTS
  // =========================

  document.getElementById("btn-scan-po")
    .onclick = () => startScanner(inputPO);

  document.getElementById("btn-scan-batch")
    .onclick = () => startScanner(inputBatch);

  document.getElementById("btn-close-cam")
    .onclick = stopScanner;

  document.getElementById("qc-submit")
    .onclick = () => alert("SUBMIT BERHASIL");

  document.getElementById("qc-close-panel")
    .onclick = () => {
      stopScanner();
      setTimeout(() => {
        document.getElementById("qc-panel")?.remove();
      }, 300);
    };

})();
