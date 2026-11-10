import express from "express";

const app = express();
const PORT = 4000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "personal-finance-api",
  });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});