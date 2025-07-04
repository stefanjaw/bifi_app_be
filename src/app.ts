import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { companyRouter, countryRouter } from "./modules";

// load .env variables
dotenv.config();
const PORT = process.env.PORT || 8000;
const MONGO_DB_URL = process.env.MONGO_DB_URL || "";

// create app
const app = express();

// routes will be here
app.use(countryRouter);
app.use(companyRouter);

// start function
const start = async () => {
  try {
    // init mongoose
    await mongoose.connect(MONGO_DB_URL);

    // init app
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export { start };
