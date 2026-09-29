require("dotenv").config();

// Ensure critical environment variables exist
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is missing! Falling back to default in dev, but MUST be set in production.");
}

const app = require('./src/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});