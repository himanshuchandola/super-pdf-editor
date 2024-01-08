import React, { useState } from "react";
import { Worker } from "@react-pdf-viewer/core";
import { Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import { PDFDocument } from "pdf-lib";

const PdfViewer = () => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState("");
  const [image, setImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 });

  const [hasChanges, setHasChanges] = useState(false);

  const allowedFiles = ["application/pdf"];

  const handleFile = (e) => {
    let selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile && allowedFiles.includes(selectedFile.type)) {
        let reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onloadend = (e) => {
          setPdfError("");
          setPdfFile(e.target.result);
        };
      } else {
        setPdfError("Not a valid pdf: Please select only PDF");
        setPdfFile("");
      }
    } else {
      console.log("please select a PDF");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
    setHasChanges(true);
  };

  // Handle resize stop
  const onResizeStop = (e, direction, ref, d) => {
    setImageSize({
      width: imageSize.width + d.width,
      height: imageSize.height + d.height,
    });
  };

  const onDragStop = (e, data) => {
    setImagePosition({ x: data.x, y: data.y });
  };

  const handleSavePdf = async () => {
    try {
      const existingPdfBytes = await fetch(pdfFile).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const imageBytes = await fetch(image).then((res) => res.arrayBuffer());
      const embeddedImage = await pdfDoc.embedPng(imageBytes);
      const firstPage = pdfDoc.getPage(0);
      firstPage.drawImage(embeddedImage, {
        x: imagePosition.x,
        y: firstPage.getHeight() - imagePosition.y - imageSize.height,
        width: imageSize.width,
        height: imageSize.height,
      });

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "updated-pdf.pdf";
      link.click();
    } catch (error) {
      console.error("Error saving PDF:", error);
    }
  };

  return (
    <div className="container">
      <form>
        <label>
          <h5>Upload PDF</h5>
        </label>
        <br></br>

        <input
          type="file"
          className="form-control"
          onChange={handleFile}
        ></input>
        {pdfError && <span className="text-danger">{pdfError}</span>}
      </form>
      <form>
        <label>
          <h5>Add Image</h5>
        </label>
        <br></br>
        <input
          type="file"
          accept="image/*"
          className="form-control"
          onChange={handleImageUpload}
        />
      </form>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h5>View PDF</h5>
        {hasChanges && (
          <button onClick={handleSavePdf} style={{ marginLeft: "auto" }}>
            Download Updated PDF
          </button>
        )}
      </div>
      <div className="viewer" style={{ position: "relative" }}>
        {pdfFile && (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={pdfFile}
              plugins={[defaultLayoutPluginInstance]}
            ></Viewer>
          </Worker>
        )}
        {!pdfFile && <>No file is selected yet</>}
      </div>
      <div className="image-container">
        {image && (
          <Draggable>
            <Resizable
              size={imageSize}
              onResizeStop={onResizeStop}
              defaultSize={{
                width: 200,
                height: 200,
              }}
            >
              <img
                src={image}
                alt="Uploaded"
                style={{ width: "100%", height: "100%" }}
              />
            </Resizable>
          </Draggable>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
