import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import { catchExceptionMiddleware, GridFSBucketService } from "./system";
import {
  ActivityHistoryRouter,
  CompanyRouter,
  ContactRouter,
  CountryRouter,
  FacilityRouter,
  MaintenanceWindowRouter,
  ProductComissioningRouter,
  ProductMaintenanceRouter,
  ProductRouter,
  ProductTypeRouter,
  RoomRouter,
} from "./modules";
import { FileRouter } from "./modules/files/routes/file-routes";

// load .env variables
dotenv.config();
const PORT = process.env.SERVER_PORT || 8080;
const MONGO_DB_URL =
  process.env.MONGO_DB_URL || "mongodb://localhost:27017/bifi_app_db"; // default MongoDB URL for local development

// create app
const app = express();
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

// routes will be here, main route inits with /api and then it uses the routers
app.get("/api/filesv2/:id", (req, res) => {
  res.status(200).json({ message: "Welcome to the BIFI App Backend API" });
});
app.use("/api", new FileRouter().getRouter);
app.use("/api", new CountryRouter().getRouter);
app.use("/api", new CompanyRouter().getRouter);
app.use("/api", new ContactRouter().getRouter);
app.use("/api", new ProductTypeRouter().getRouter);
app.use("/api", new MaintenanceWindowRouter().getRouter);
app.use("/api", new FacilityRouter().getRouter);
app.use("/api", new RoomRouter().getRouter);
app.use("/api", new ProductRouter().getRouter);
app.use("/api", new ProductComissioningRouter().getRouter);
app.use("/api", new ProductMaintenanceRouter().getRouter);
app.use("/api", new ActivityHistoryRouter().getRouter);

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
