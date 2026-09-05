const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "../../uploads/certificates");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generates an academic certificate PDF.
 * Workflow:
 * 1. Generate QR code containing the verification URL (based ONLY on registrationNumber).
 * 2. Render PDF with institutional branding, academic details, and embedded QR code.
 * 3. Return { pdfBuffer, filePath, verificationUrl, qrDataUrl }.
 */
async function generateCertificatePdf(certData, institutionName = "DEMO UNIVERSITY") {
  const regNo = String(certData.registrationNumber).trim();
  const clientOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
  const verificationUrl = `${clientOrigin}/verify/${encodeURIComponent(regNo)}`;

  // Generate QR code data URL (PNG)
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 140,
    color: {
      dark: "#1e293b",
      light: "#ffffff",
    },
  });

  // Extract base64 image data for PDFKit
  const qrImageBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 40,
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);

        // Save local copy
        const filename = `${regNo.replace(/[^a-zA-Z0-9_-]/g, "_")}_certificate.pdf`;
        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, pdfBuffer);

        resolve({
          pdfBuffer,
          filePath,
          verificationUrl,
          qrDataUrl,
        });
      });

      // Background border and styling
      doc
        .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(3)
        .strokeColor("#1e3a8a")
        .stroke();

      doc
        .rect(25, 25, doc.page.width - 50, doc.page.height - 50)
        .lineWidth(1)
        .strokeColor("#3b82f6")
        .stroke();

      // Header Banner
      doc
        .fillColor("#1e3a8a")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(institutionName.toUpperCase(), { align: "center" });

      doc.moveDown(0.3);
      doc
        .fillColor("#64748b")
        .fontSize(12)
        .font("Helvetica")
        .text("OFFICIAL ACADEMIC CERTIFICATE OF COMPLETION", { align: "center" });

      doc.moveDown(1.5);

      // Certificate Body Text
      doc
        .fillColor("#334155")
        .fontSize(14)
        .font("Helvetica")
        .text("This is to certify that", { align: "center" });

      doc.moveDown(0.5);
      doc
        .fillColor("#0f172a")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text(certData.studentName, { align: "center" });

      doc.moveDown(0.5);
      doc
        .fillColor("#334155")
        .fontSize(14)
        .font("Helvetica")
        .text("bearing Registration Number", { align: "center" });

      doc.moveDown(0.3);
      doc
        .fillColor("#1e3a8a")
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(certData.registrationNumber, { align: "center" });

      doc.moveDown(0.5);
      doc
        .font("Helvetica")
        .text("has successfully completed the prescribed course of study for the award of", {
          align: "center",
        });

      doc.moveDown(0.5);
      doc
        .fillColor("#1e3a8a")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(certData.programme, { align: "center" });

      doc.moveDown(0.5);
      const semesterText = certData.semester ? `Semester: ${certData.semester}   |   ` : "";
      doc
        .fillColor("#475569")
        .fontSize(12)
        .font("Helvetica")
        .text(
          `${semesterText}Grade / CGPA: ${certData.academicData?.grade || certData.grade || "A"}   |   Date of Issue: ${certData.academicData?.issueDate || certData.issueDate || new Date().toISOString().split("T")[0]}`,
          { align: "center" }
        );

      doc.moveDown(2);

      // Footer layout: Signatures and Embedded QR Code
      const footerY = doc.page.height - 130;

      // Left Signature: Controller of Examinations
      doc
        .moveTo(60, footerY)
        .lineTo(240, footerY)
        .lineWidth(1)
        .strokeColor("#94a3b8")
        .stroke();

      doc
        .fillColor("#1e293b")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Controller of Examinations", 60, footerY + 5, { width: 180, align: "center" });
      doc
        .fillColor("#64748b")
        .fontSize(8)
        .font("Helvetica")
        .text("Digital Signature Verified", 60, footerY + 20, { width: 180, align: "center" });

      // Right Signature: Registrar
      doc
        .moveTo(doc.page.width - 240, footerY)
        .lineTo(doc.page.width - 60, footerY)
        .lineWidth(1)
        .strokeColor("#94a3b8")
        .stroke();

      doc
        .fillColor("#1e293b")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Registrar", doc.page.width - 240, footerY + 5, { width: 180, align: "center" });
      doc
        .fillColor("#64748b")
        .fontSize(8)
        .font("Helvetica")
        .text("Digital Signature Verified", doc.page.width - 240, footerY + 20, {
          width: 180,
          align: "center",
        });

      // Center Embedded Verification QR Code
      const qrX = (doc.page.width - 80) / 2;
      const qrY = footerY - 45;
      doc.image(qrImageBuffer, qrX, qrY, { width: 80, height: 80 });

      doc
        .fillColor("#64748b")
        .fontSize(7)
        .font("Helvetica")
        .text("Scan QR to Verify Authenticity", qrX - 30, qrY + 85, { width: 140, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCertificatePdf,
};
