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
  FTPService,
  userStorage,
} from "./system";
import {
  ActivityHistoryRouter,
  HelpdeskStageRouter,
  TicketRouter,
  TicketRuleRouter,
  CompanyRouter,
  ContactRouter,
  CountryRouter,
  CRMRouter,
  CrmStageRouter,
  SalesRouter,
  SalesOrderRouter,
  SalesOrderStageRouter,
  SalesTargetRouter,
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
  ProjectStageRouter,
  TaskStageRouter,
  TaskTypeRouter,
  TaskRouter,
  GenAIRouter,
  ShippingRouter,
  BCDTransportOptionRouter,
  BCDRouter,
  BCDTypeRouter,
  BCDAdditionalInformationTypeRouter,
  BCDTaxIdRouter,
  SupplierRouter,
  PurchaseOrderRouter,
  PurchaseStageRouter,
  PurchaseSettingsRouter,
  PurchasesDashboardRouter,
  BCDTaxTypeRouter,
  BCDPortRouter,
  BCDChargeCodeRouter,
  BCDCpcRouter,
  WarehouseRouter,
  LocationRouter,
  ProductRouter,
  InventoryDashboardRouter,
  InventorySettingsRouter,
  StockBalanceRouter,
  StockMovementRouter,
  UomCategoryRouter,
  UomRouter,
  ProductTypeRouter,
  CurrencyRouter,
  ExchangeRateRouter,
  AccountRouter,
  TaxRouter,
  DiscountRouter,
  PaymentTermRouter,
  FiscalPositionRouter,
  JournalRouter,
  JournalEntryRouter,
  PaymentRouter,
  InvoiceRouter,
  SequenceRouter,
  AccountingSettingsRouter,
  GemsRouter,
  AiSettingsRouter,
  DriveSettingsRouter,
  TranslationRouter,
  LanguageRouter,
  PricingIndexRouter,
  PricingEstimateRouter,
  CustomsChapterRouter,
  CustomsHeadingRouter,
  CustomsTariffRouter,
  ReportBugRouter,
  UserShortcutsRouter,
  EmailSettingsRouter,
  EmailTemplateRouter,
  MailingListRouter,
  SubscriberRouter,
  EmailCampaignRouter,
  EmailEventRouter,
  EmailMarketingPublicRouter,
  CondicionVentaRouter,
  MedioPagoRouter,
  CrEinvoiceSettingsRouter,
  CrEinvoicePublicRouter,
  CrEinvoiceActionRouter,
  SearchDestinationRouter,
  SearchRouter,
  NotificationRouter,
  NotificationSettingsRouter,
} from "./modules";
import { startCampaignScheduler } from "./modules/email-marketing/services/campaign-send-service";
import { seedPurchaseStages } from "./modules/purchase-stages";
import { seedSearchDestinations } from "./modules/search-destinations";

import admin from "firebase-admin";

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
      token: undefined,
      dbName: undefined,
    },
    () => next(),
  );
});

// enable morgan
app.use(morgan("dev"));

// enable cors
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(express.json());

// public, unauthenticated email-marketing routes (tracking, unsubscribe, webhooks)
app.use("/api", new EmailMarketingPublicRouter().getRouter);

// public, unauthenticated CR E-Invoice Hacienda callback
app.use("/api", new CrEinvoicePublicRouter().getRouter);

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
app.use("/api", new HelpdeskStageRouter().getRouter);
app.use("/api", new TicketRouter().getRouter);
app.use("/api", new TicketRuleRouter().getRouter);
app.use("/api", new CRMRouter().getRouter);
app.use("/api", new CrmStageRouter().getRouter);
app.use("/api", new SalesOrderStageRouter().getRouter);
app.use("/api", new SalesOrderRouter().getRouter);
app.use("/api", new SalesTargetRouter().getRouter);
app.use("/api", new SalesRouter().getRouter);
app.use("/api", new ReportingRouter().getRouter);
app.use("/api", new TemplateRouter().getRouter);
app.use("/api", new ModelRouter().getRouter);
app.use("/api", new TaskRouter().getRouter);
app.use("/api", new ProjectRouter().getRouter);
app.use("/api", new ProjectStageRouter().getRouter);
app.use("/api", new TaskStageRouter().getRouter);
app.use("/api", new TaskTypeRouter().getRouter);
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
app.use("/api", new SupplierRouter().getRouter);
app.use("/api", new PurchaseOrderRouter().getRouter);
app.use("/api", new PurchaseStageRouter().getRouter);
app.use("/api", new PurchaseSettingsRouter().getRouter);
app.use("/api", new PurchasesDashboardRouter().getRouter);
app.use("/api", new WarehouseRouter().getRouter);
app.use("/api", new LocationRouter().getRouter);
app.use("/api", new ProductRouter().getRouter);
app.use("/api", new StockBalanceRouter().getRouter);
app.use("/api", new StockMovementRouter().getRouter);
app.use("/api", new UomCategoryRouter().getRouter);
app.use("/api", new UomRouter().getRouter);
app.use("/api", new ProductTypeRouter().getRouter);
app.use("/api", new InventoryDashboardRouter().getRouter);
app.use("/api", new InventorySettingsRouter().getRouter);
app.use("/api", new CurrencyRouter().getRouter);
app.use("/api", new ExchangeRateRouter().getRouter);
app.use("/api", new AccountRouter().getRouter);
app.use("/api", new TaxRouter().getRouter);
app.use("/api", new DiscountRouter().getRouter);
app.use("/api", new PaymentTermRouter().getRouter);
app.use("/api", new FiscalPositionRouter().getRouter);
app.use("/api", new JournalRouter().getRouter);
app.use("/api", new JournalEntryRouter().getRouter);
app.use("/api", new PaymentRouter().getRouter);
app.use("/api", new InvoiceRouter().getRouter);
app.use("/api", new AccountingSettingsRouter().getRouter);
app.use("/api", new SequenceRouter().getRouter);
app.use("/api", new GemsRouter().getRouter);
app.use("/api", new AiSettingsRouter().getRouter);
app.use("/api", new DriveSettingsRouter().getRouter);
app.use("/api", new TranslationRouter().getRouter);
app.use("/api", new LanguageRouter().getRouter);
app.use("/api", new PricingIndexRouter().getRouter);
app.use("/api", new PricingEstimateRouter().getRouter);
app.use("/api", new CustomsChapterRouter().getRouter);
app.use("/api", new CustomsHeadingRouter().getRouter);
app.use("/api", new CustomsTariffRouter().getRouter);
app.use("/api", new ReportBugRouter().getRouter);
app.use("/api", new UserShortcutsRouter().getRouter);
app.use("/api", new EmailSettingsRouter().getRouter);
app.use("/api", new EmailTemplateRouter().getRouter);
app.use("/api", new MailingListRouter().getRouter);
app.use("/api", new SubscriberRouter().getRouter);
app.use("/api", new EmailCampaignRouter().getRouter);
app.use("/api", new EmailEventRouter().getRouter);
app.use("/api", new SearchDestinationRouter().getRouter);
app.use("/api", new SearchRouter().getRouter);
app.use("/api", new NotificationRouter().getRouter);
app.use("/api", new NotificationSettingsRouter().getRouter);

// CR E-Invoice routes
app.use("/api", new CondicionVentaRouter().getRouter);
app.use("/api", new MedioPagoRouter().getRouter);
app.use("/api", new CrEinvoiceSettingsRouter().getRouter);
app.use("/api", new CrEinvoiceActionRouter().getRouter);

// health check route
app.get("/api/health-check", (req, res) => {
  res.status(200).json({
    message: "Welcome to the BIFI App Backend API",
    version: "202607131320",
    status: "OK",
  });
});

// middlewares
app.use(catchExceptionMiddleware);

// start function
const start = async () => {
  try {
    // init mongoose
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_DB_URL, {
      timeoutMS: 5000, // 5 seconds timeout
    });

    console.log("Connected to MongoDB successfully!");

    // init ftpservice
    FTPService.initiate({
      host: process.env.FTP_HOST || "",
      basePath: process.env.FTP_BASE_PATH || "",
      user: process.env.FTP_USER || "",
      password: process.env.FTP_PASSWORD || "",
    });

    // seed default purchase stages (idempotent — only runs when collection is empty)
    await seedPurchaseStages();

    // seed default search destinations (idempotent — only runs when collection is empty)
    await seedSearchDestinations();

    // start the scheduled email campaign processor
    startCampaignScheduler();

    // init app
    app.listen(Number(PORT), "0.0.0.0", () => {
      //  get current url
      console.log(`Server running successfully on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    start(); // retry connection
  }
};

export { start };
