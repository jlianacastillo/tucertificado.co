const userName = document.getElementById("name");
const userN = document.getElementById("id");
const CertificateID = document.getElementById("IdC");
const submitBtn = document.getElementById("submitBtn");
const { PDFDocument, rgb, degrees } = PDFLib;

submitBtn.addEventListener("click", () => {
  const nameVal = userName.value;
  const idVal = userN.value;
  
  if (!validateName(nameVal)) {
    alert('Por favor, ingresa un nombre válido (solo letras).');
    return;
  }

  if (!validateID(idVal)) {
    alert('Por favor, ingresa un número de identificación válido (solo números).');
    return;
  }

  generatePDF(nameVal, idVal);
});

const validateName = (name) => {
  return /^[a-zA-Z\s]{1,40}$/.test(name);
}

const validateID = (id) => {
  return /^\d{7,11}$/.test(id);
}

const generatePDF = async (name, id) => {
  const fileName = `${name.replace(/\s/g, " ")}.pdf`;
  const existingPdfBytes = await fetch("./Certificado.pdf").then((res) =>
    res.arrayBuffer()
  );

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);
  
  const fontBytes = await fetch("./CenturyGothic.ttf").then((res) =>
    res.arrayBuffer()
  );

  const CenturyGothic = await pdfDoc.embedFont(fontBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  const textSize = 30;
  const pageWidth = firstPage.getWidth();
  const pageHeight = firstPage.getHeight();

  const nameTextWidth = CenturyGothic.widthOfTextAtSize(name, textSize);
  const nameTextHeight = CenturyGothic.widthOfTextAtSize(name, textSize);
  const idTextWidth = CenturyGothic.widthOfTextAtSize(id, 15);
  const idTextHeight = CenturyGothic.widthOfTextAtSize(id, textSize);

  const centerXName = (pageWidth - nameTextWidth) / 2;
  const centerXId = (pageWidth - idTextWidth) / 2;

  const idOffset = (nameTextWidth - idTextWidth) / 2 * 0.08;

  const IdC = generateUniqueIdC();
  const idCTextWidth = CenturyGothic.widthOfTextAtSize(IdC, textSize);

  const totalTextWidth = Math.max(nameTextWidth, idTextWidth);
  const totalTextHeight = Math.max(nameTextHeight, idTextHeight);
  const centerX = (pageWidth - totalTextWidth) / 2;
  
  const nameY = 270;
  const idY = 245;

  firstPage.drawText(name, {
    x: centerXName,
    y: nameY,
    size: textSize,
  });

  firstPage.drawText(id, {
    x: centerXId + idOffset, 
    y: idY,
    size: 15,
  });

  firstPage.drawText(IdC, {
    x: 55,
    y: 70,
    size: 10,
  });

  const currentTime = new Date().toLocaleString();
  firstPage.drawText(currentTime, {
    x: 55,
    y: 55,
    size: 10,
  });

  const qrCodeData = `Certificado de: ${name}\nCon numero de CC: ${id}\nFecha: ${currentTime}\n${IdC}\n`;
  const qrCode = await generateQR(qrCodeData);

  const qrCodeImage = await pdfDoc.embedPng(qrCode);
  const qrCodeWidth = 80;
  const qrCodeHeight = 80;

  firstPage.drawImage(qrCodeImage, {
    x: 55,
    y: 85,
    width: qrCodeWidth,
    height: qrCodeHeight,
  });

  const pdfBytes = await pdfDoc.save();

  console.log("Certificado Creado");
  var file = new File([pdfBytes], fileName, {
      type: "application/pdf;charset=utf-8",
    });

  saveAs(file);
};

const generateQR = async (data) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data)}`;
  const qrCodeResponse = await fetch(qrCodeUrl);
  const qrCodeBlob = await qrCodeResponse.blob();
  return new Uint8Array(await qrCodeBlob.arrayBuffer());
};

const generateUniqueIdC = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const idLength = 20;
  let id = "ID unico del certificado: ";
  for (let i = 0; i < idLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters[randomIndex];
  }
  return id;
};
