const QRCode = require("qrcode");

async function generateQRWithLogo(url) {
  try {
    const qrSize = 400;

    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: qrSize,
      color: {
        dark: "#456882", 
        light: "#FFFFFF",
      },
    });

    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

module.exports = generateQRWithLogo;
