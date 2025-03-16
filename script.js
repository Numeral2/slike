const express = require("express");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const axios = require("axios");
const path = require("path");
const cors = require("cors"); // Import CORS

// Initialize Express app
const app = express();
const port = process.env.PORT || 10000;

// Enable CORS for all routes
app.use(cors());

// Set up multer for handling image uploads
const upload = multer({ dest: "uploads/" });

// Route to serve index.html (assuming it's in the same folder as the script)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route to process image and extract text using Tesseract.js
app.post("/process-image", upload.array("files", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files selected" });
  }

  if (req.files.length > 10) {
    return res
      .status(400)
      .json({ error: "You can upload a maximum of 10 images" });
  }

  try {
    let extractedText = "";

    // Process each uploaded file with Tesseract
    for (const file of req.files) {
      const result = await Tesseract.recognize(file.path, "eng", {
        logger: (m) => console.log(m),
      });
      extractedText += result.data.text + "\n\n";
    }

    // Send back the extracted text as a JSON response
    return res.json({ extracted_text: extractedText });
  } catch (err) {
    console.error("Error processing file:", err);
    return res.status(500).json({ error: "Error processing files" });
  }
});

// Route to send extracted text to Make.com
app.post("/send-to-make", express.json(), async (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const makeUrl = "https://hook.eu2.make.com/y94u5xvkf97g5nym3trgz2j2107nuu12"; // Replace with your Make.com webhook URL

  try {
    const response = await axios.post(makeUrl, { text });

    if (response.data.summary) {
      return res.json({ summary: response.data.summary });
    } else {
      return res
        .status(500)
        .json({ error: "No summary returned from Make.com" });
    }
  } catch (err) {
    console.error("Failed to send to Make.com:", err);
    return res.status(500).json({ error: "Failed to send to Make.com" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
