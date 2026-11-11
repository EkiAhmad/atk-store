/**
 * Helper untuk mengunduh file secara aman dengan menyertakan JWT token
 * Mendukung pembacaan nama file dari header Content-Disposition
 * Menggunakan penundaan revocation URL untuk mencegah error "File wasn't available on site"
 */
export async function downloadFile(url, fallbackFilename = 'download') {
  const token = localStorage.getItem('atk_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    let errMsg = `Gagal mengunduh file (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.message) {
        errMsg = errJson.message;
      }
    } catch (_) {}
    throw new Error(errMsg);
  }

  // Ambil nama file dari header Content-Disposition jika tersedia
  let filename = fallbackFilename;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '').trim();
    }
  }

  const rawBlob = await response.blob();

  // Tentukan MIME type yang tepat sesuai ekstensi
  let mimeType = rawBlob.type;
  if (filename.endsWith('.xlsx')) {
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (filename.endsWith('.csv')) {
    mimeType = 'text/csv;charset=utf-8;';
  }

  const fileBlob = new Blob([rawBlob], { type: mimeType });
  const blobUrl = window.URL.createObjectURL(fileBlob);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();

  // Beri jeda 15 detik sebelum mencabut URL blob agar browser selesai menulis file ke disk
  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
    window.URL.revokeObjectURL(blobUrl);
  }, 15000);
}
