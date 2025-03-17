const Tesseract = require("tesseract.js");
const axios = require("axios");
const formidable = require("formidable");
const path = require("path");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    // Serve the index.html file
    res.sendFile(path.join(__dirname, "../index.html"));
  } else if (req.method === "POST" && req.url === "/process-image") {
    // Handle image upload using formidable
    const form = new formidable.IncomingForm();
    form.uploadDir = "/tmp"; // Ensure Vercel compatibility
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form:", err);
        return res.status(500).json({ error: "Error parsing form" });
      }

      const filesArray = Object.values(files);
      if (!filesArray || filesArray.length === 0) {
        return res.status(400).json({ error: "No files selected" });
      }

      if (filesArray.length > 10) {
        return res
          .status(400)
          .json({ error: "You can upload a maximum of 10 images" });
      }

      try {
        let extractedText = "";

        for (const file of filesArray) {
          const result = await Tesseract.recognize(file.filepath, "eng", {
            logger: (m) => console.log(m),
          });
          extractedText += result.data.text + "\n\n";
        }

        return res.status(200).json({ extracted_text: extractedText });
      } catch (err) {
        console.error("Error processing file:", err);
        return res.status(500).json({ error: "Error processing files" });
      }
    });
  } else if (req.method === "POST" && req.url === "/send-to-make") {
    try {
      const body = req.body;
      if (!body.text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const makeUrl =
        "https://hook.eu2.make.com/y94u5xvkf97g5nym3trgz2j2107nuu12";
      const response = await axios.post(makeUrl, { text: body.text });
      return res.json({
        summary: response.data.summary || "No summary returned",
      });
    } catch (err) {
      console.error("Failed to send to Make.com:", err);
      return res.status(500).json({ error: "Failed to send to Make.com" });
    }
  } else {
    res.status(404).json({ error: "Route not found" });
  }
};
