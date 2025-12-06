const QRCodeWithLogo = require("qr-code-with-logo");

async function generateQRWithLogo(url) {
  const qrImage = await QRCodeWithLogo.toDataURL({
    content: url,
    logo: "/Images/bgFavicon.png", 
    logoWidth: 80,
    logoHeight: 80,
    logoBackgroundTransparent: true,
  });

  return qrImage;
}

module.exports = generateQRWithLogo;
