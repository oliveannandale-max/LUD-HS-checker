// OCR module using Tesseract.js (client‑side OCR)
// Exposes a global function `performOCR(file)` that returns a Promise<string>
// The extracted text is trimmed and returned.
// Tesseract.js is loaded via CDN in index.html before this script.

window.performOCR = async function (file) {
  if (!window.Tesseract) {
    throw new Error("Tesseract.js library not loaded.");
  }
  // Use Tesseract to recognize the image (supports handwriting to some extent)
  const { data: { text } } = await Tesseract.recognize(file, "eng", {
    // Set options suitable for handwritten text
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-/:() ",
    // The following preset may improve handwriting recognition
    // Note: Tesseract's default model is not specialized for handwriting, but it works for many cases.
    // Users can later replace with a better model if needed.
    logger: m => console.log(m)
  });
  return text.trim();
};
