import app from "./app";

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV ?? "development"}`);
});