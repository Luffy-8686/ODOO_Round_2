/**
 * Triggers a guaranteed .pdf download in the browser by fetching the binary stream,
 * creating an application/pdf blob, and executing a synthetic anchor download.
 */
export async function downloadPdfInvoice(url: string, preferredFilename: string): Promise<void> {
  const filename = preferredFilename.endsWith(".pdf") ? preferredFilename : `${preferredFilename}.pdf`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Invoice PDF request returned HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(pdfBlob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (err) {
    console.warn("Client blob download failed, falling back to window navigation:", err);
    const fallbackLink = document.createElement("a");
    fallbackLink.href = url;
    fallbackLink.setAttribute("download", filename);
    fallbackLink.setAttribute("target", "_blank");
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);
  }
}
