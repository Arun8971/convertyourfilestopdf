async function convertFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file.');
        return;
    }

    const fileType = file.type;
    let pdfBytes;
    
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        pdfBytes = await convertDocxToPdf(file);
    } else if (fileType === 'image/jpeg' || fileType === 'image/png') {
        pdfBytes = await convertImageToPdf(file);
    } else {
        alert('Unsupported file type. Please upload a DOCX or image file.');
        return;
    }

    downloadPdf(pdfBytes, 'output.pdf');
}

async function convertDocxToPdf(file) {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
        reader.onload = function(event) {
            const content = event.target.result;
            const zip = new PizZip(content);
            const doc = new window.docxtemplater().loadZip(zip);
            const pdfDoc = PDFLib.PDFDocument.create();
            
            doc.getFullText().split('\n').forEach(async (line) => {
                const page = pdfDoc.addPage();
                const { width, height } = page.getSize();
                page.drawText(line, { x: 50, y: height - 50 });
            });

            pdfDoc.save().then(resolve).catch(reject);
        };
        reader.readAsBinaryString(file);
    });
}

async function convertImageToPdf(file) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = async function(event) {
            const imageBytes = new Uint8Array(event.target.result);
            const pdfDoc = await PDFLib.PDFDocument.create();
            const image = await pdfDoc.embedJpg(imageBytes);
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const imageDims = image.scaleToFit(width - 100, height - 100);

            page.drawImage(image, {
                x: (width - imageDims.width) / 2,
                y: (height - imageDims.height) / 2,
                width: imageDims.width,
                height: imageDims.height,
            });

            const pdfBytes = await pdfDoc.save();
            resolve(pdfBytes);
        };
        reader.readAsArrayBuffer(file);
    });
}

function downloadPdf(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
          }
