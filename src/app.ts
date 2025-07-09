import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import {
  companyRouter,
  contactRouter,
  countryRouter,
  facilityRouter,
  maintenanceWindowRouter,
  productRouter,
  productTypeRouter,
  roomRouter,
} from "./modules";
import { GridFSBucketService } from "./utils";

// load .env variables
dotenv.config();
const PORT = process.env.PORT || 8000;
const MONGO_DB_URL =
  process.env.MONGO_DB_URL || "mongodb://localhost:27017/bifi_app_db"; // default MongoDB URL for local development

// create app
const app = express();
app.use(morgan("dev"));

// routes will be here
app.use(countryRouter);
app.use(companyRouter);
app.use(contactRouter);
app.use(productTypeRouter);
app.use(maintenanceWindowRouter);
app.use(facilityRouter);
app.use(roomRouter);
app.use(productRouter);

// start function
const start = async () => {
  try {
    // init mongoose
    await mongoose.connect(MONGO_DB_URL);

    // create bucket to save images
    if (mongoose.connection.db)
      GridFSBucketService.initiate(mongoose.connection.db);

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
