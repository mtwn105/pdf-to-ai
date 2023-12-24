const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const axios = require("axios").default;
const { v4: uuidv4 } = require("uuid");

const { Pdf } = require("./schemas");

const connectDB = require("./db");

require("dotenv").config();

connectDB();

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

app.use(helmet.crossOriginOpenerPolicy({ policy: "same-origin-allow-popups" }));
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.ieNoOpen());
app.use(
  helmet.frameguard({
    action: "sameorigin",
  })
);
app.use(helmet.hidePoweredBy());
app.use(helmet.xssFilter());

// Upload PDF
app.post("/api/upload", async (req, res) => {
  try {
    const { fileName, fileUrl } = req.body;

    // Scrap PDF Content
    const { data } = await axios.post(process.env.MINDS_DB_URL, {
      query: `SELECT text_content FROM my_web.crawler WHERE url = '${fileUrl}' LIMIT 1`,
    });

    const pdfContent = data.data[0][0];

    // Get first 2000 characters
    const pdfContentShort = pdfContent.substring(0, 2000);

    // Save PDF to DB
    const pdf = await Pdf.create({
      fileName,
      fileUrl,
      content: pdfContentShort,
    });

    // console.log(JSON.stringify(data.data[0]));

    // Give Response
    res.send({
      message: "PDF uploaded successfully",
      pdfId: pdf._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
});

// Get PDF
app.get("/pdf/:id", async (req, res) => {
  const { id } = req.params;

  // Get PDF from DB
  const pdf = await Pdf.findById(id);

  // Give Response
  res.json({ pdf });
});

// Give Response using MindsDB
app.post("/predict", async (req, res) => {
  const { pdfId, query } = req.body;

  // Get PDF from DB
  const pdf = await Pdf.findById(pdfId);

  // Get PDF Content
  const { content } = pdf;

  // Give Response
  res.json({ prediction });
});

// Error Handler
notFound = (req, res, next) => {
  res.status(404);
  const error = new Error("Not Found - " + req.originalUrl);
  next(error);
};

errorHandler = (err, req, res) => {
  res.status(res.statusCode || 500);
  res.json({
    error: err.name,
    message: err.message,
  });
};

app.use(notFound);
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`PDF to AI server is listening on ${port}`);
});
