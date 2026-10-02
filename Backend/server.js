require("dotenv").config();

const validateEnv = require("./src/config/validateEnv");
validateEnv();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
