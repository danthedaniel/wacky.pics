const dropArea = /** @type {HTMLElement} */ (document.getElementById("drop-area"));
const fileInput = /** @type {HTMLInputElement} */ (document.getElementById("file-input"));
const uploadsContainer = /** @type {HTMLElement} */ (document.getElementById("uploads"));

dropArea.addEventListener("click", () => fileInput.click());

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragging");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragging");
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragging");
  if (e.dataTransfer) {
    handleFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files) {
    handleFiles(fileInput.files);
  }
  fileInput.value = "";
});

/** @param {FileList} files */
function handleFiles(files) {
  for (const file of files) {
    uploadFile(file);
  }
}

/** @param {File} file */
function uploadFile(file) {
  const item = document.createElement("div");
  item.className = "upload-item";
  item.innerHTML = `
    <div class="filename">${escapeHtml(file.name)}</div>
    <div class="progress-bar"><div class="progress-fill"></div></div>
  `;
  uploadsContainer.prepend(item);

  const progressFill = /** @type {HTMLElement} */ (item.querySelector(".progress-fill"));
  const formData = new FormData();
  formData.append("file", file);

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener("progress", (e) => {
    if (e.lengthComputable) {
      const pct = (e.loaded / e.total) * 100;
      progressFill.style.width = pct + "%";
    }
  });

  xhr.addEventListener("load", () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const data = JSON.parse(xhr.responseText);
      const url = data.url;
      const fullUrl = location.origin + url;
      item.innerHTML = `
        <div class="filename">${escapeHtml(file.name)}</div>
        <a href="${url}" target="_blank">${fullUrl}</a>
      `;
    } else {
      let msg = "Upload failed";
      try {
        msg = JSON.parse(xhr.responseText).error || msg;
      } catch {}
      item.innerHTML = `
        <div class="filename">${escapeHtml(file.name)}</div>
        <div class="error">${escapeHtml(msg)}</div>
      `;
    }
  });

  xhr.addEventListener("error", () => {
    item.innerHTML = `
      <div class="filename">${escapeHtml(file.name)}</div>
      <div class="error">Network error</div>
    `;
  });

  xhr.open("POST", "/upload");
  xhr.send(formData);
}

/** @param {string} str */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
