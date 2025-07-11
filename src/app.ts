import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import {
  companyRouter,
  contactRouter,
  countryRouter,
  FacilityRouter,
  maintenanceWindowRouter,
  ProductComissioningRouter,
  ProductRouter,
  ProductTypeRouter,
  RoomRouter,
} from "./modules";
import { catchExceptionMiddleware, GridFSBucketService } from "./system";

// load .env variables
dotenv.config();
const PORT = process.env.SERVER_PORT || 8080;
const MONGO_DB_URL =
  process.env.MONGO_DB_URL || "mongodb://localhost:27017/bifi_app_db"; // default MongoDB URL for local development

// create app
const app = express();
app.use(morgan("dev"));

// routes will be here, main route inits with /api and then it uses the routers
app.use("/api", countryRouter);
app.use("/api", companyRouter);
app.use("/api", contactRouter);
app.use("/api", new ProductTypeRouter().getRouter);
app.use("/api", maintenanceWindowRouter);
app.use("/api", new FacilityRouter().getRouter);
app.use("/api", new RoomRouter().getRouter);
app.use("/api", new ProductRouter().getRouter);
app.use("/api", new ProductComissioningRouter().getRouter);

// middlewares
app.use(catchExceptionMiddleware);

// default route
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the BIFI App Backend API", version: "1.0.0" });
});

// start function
const start = async () => {
  try {
    // init mongoose
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_DB_URL, {
      timeoutMS: 10000, // 10 seconds timeout
    });

    console.log("Connected to MongoDB successfully!");

    // create bucket to save images
    if (mongoose.connection.db)
      GridFSBucketService.initiate(mongoose.connection.db);

    // init app
    app.listen(PORT, () => {
      //  get current url
      console.log(`Server running successfully on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    start(); // retry connection
  }
};

export { start };
