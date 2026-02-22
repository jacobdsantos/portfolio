/**
 * Export a DOM element to PDF using html2pdf.js (lazy loaded).
 * This module is designed to be dynamically imported to keep
 * the main bundle size small.
 */
export async function exportPdf(elementId: string, filename: string): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element with id "${elementId}" not found`);

  await html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save();
}
