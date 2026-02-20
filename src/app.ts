import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import {
  authenticateMiddleware,
  catchExceptionMiddleware,
  dbNameStorage,
  FTPService,
  GridFSBucketService,
  userStorage,
} from "./system";
import {
  ActivityHistoryRouter,
  BugReportingRouter,
  CompanyRouter,
  ContactRouter,
  CountryRouter,
  CRMRouter,
  FacilityRouter,
  FileRouter,
  MaintenanceWindowRouter,
  ModelRouter,
  PolicyRouter,
  AssetCommissioningRouter,
  AssetMaintenanceRouter,
  AssetRosterRouter,
  AssetTypeRouter,
  ReportingRouter,
  RoleRouter,
  RoomRouter,
  TemplateRouter,
  UserRouter,
  UserService,
  ProjectRouter,
  TaskStageRouter,
  TaskRouter,
  GenAIRouter,
  ShippingRouter,
  BCDTransportOptionRouter,
  BCDRouter,
  BCDTypeRouter,
  BCDAdditionalInformationTypeRouter,
  BCDTaxIdRouter,
  BCDTaxTypeRouter,
  BCDPortRouter,
  BCDChargeCodeRouter,
} from "./modules";

import admin from "firebase-admin";
import { BCDCpcRouter } from "./modules/bcd-cpcs";

// load .env variables
const PORT = process.env.SERVER_PORT || 8080;
const MONGO_DB_URL =
  process.env.MONGO_DB_URL || "mongodb://localhost:27017/bifi_app_db"; // default MongoDB URL for local development
const FIREBASE_SERVICE_ACCOUNT =
  process.env.FIREBASE_SERVICE_ACCOUNT || "../firebase-admin-sdk.json";

// load firebase account
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT)),
});

// create app
const app = express();

// storages
app.use((req, res, next) => {
  userStorage.run(
    {
      user: undefined,
      token: req.headers.authorization || "",
    },
    () => {
      dbNameStorage.run(undefined, () => {
        next();
      });
    },
  );
});

// enable morgan
app.use(morgan("dev"));

// enable cors
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  }),
);

app.use(authenticateMiddleware(new UserService()));

// routes will be here, main route inits with /api and then it uses the routers
app.use("/api", new FileRouter().getRouter);
app.use("/api", new CountryRouter().getRouter);
app.use("/api", new CompanyRouter().getRouter);
app.use("/api", new ContactRouter().getRouter);
app.use("/api", new AssetTypeRouter().getRouter);
app.use("/api", new MaintenanceWindowRouter().getRouter);
app.use("/api", new FacilityRouter().getRouter);
app.use("/api", new RoomRouter().getRouter);
app.use("/api", new AssetRosterRouter().getRouter);
app.use("/api", new AssetCommissioningRouter().getRouter);
app.use("/api", new AssetMaintenanceRouter().getRouter);
app.use("/api", new ActivityHistoryRouter().getRouter);
app.use("/api", new UserRouter().getRouter);
app.use("/api", new RoleRouter().getRouter);
app.use("/api", new PolicyRouter().getRouter);
app.use("/api", new BugReportingRouter().getRouter);
app.use("/api", new CRMRouter().getRouter);
app.use("/api", new ReportingRouter().getRouter);
app.use("/api", new TemplateRouter().getRouter);
app.use("/api", new ModelRouter().getRouter);
app.use("/api", new TaskRouter().getRouter);
app.use("/api", new ProjectRouter().getRouter);
app.use("/api", new TaskStageRouter().getRouter);
app.use("/api", new GenAIRouter().getRouter);
app.use("/api", new ShippingRouter().getRouter);
app.use("/api", new BCDRouter().getRouter);
app.use("/api", new BCDTypeRouter().getRouter);
app.use("/api", new BCDAdditionalInformationTypeRouter().getRouter);
app.use("/api", new BCDTransportOptionRouter().getRouter);
app.use("/api", new BCDTaxIdRouter().getRouter);
app.use("/api", new BCDTaxTypeRouter().getRouter);
app.use("/api", new BCDCpcRouter().getRouter);
app.use("/api", new BCDPortRouter().getRouter);
app.use("/api", new BCDChargeCodeRouter().getRouter);

// middlewares
app.use(catchExceptionMiddleware);

// default route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the BIFI App Backend API",
    version: "202601231340",
  });
});

// start function
const start = async () => {
  try {
    // init mongoose
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_DB_URL, {
      timeoutMS: 5000, // 5 seconds timeout
    });

    console.log("Connected to MongoDB successfully!");

    // create bucket to save images
    if (mongoose.connection.db)
      GridFSBucketService.initiate(mongoose.connection.db);

    // init ftpservice
    FTPService.initiate({
      host: process.env.FTP_HOST || "",
      basePath: process.env.FTP_BASE_PATH || "",
      user: process.env.FTP_USER || "",
      password: process.env.FTP_PASSWORD || "",
    });

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
