import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
  RecurrentTaskRouter,
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
  ProgressNoteRouter,
  NoteRouter,
  ProgressNoteTagRouter,
  VitalSignRouter,
  VitalSignTypeRouter,
  FluidTrackRouter,
  FluidTrackItemRouter,
  StaffRouter,
  GroupRouter,
  ShiftRouter,
  VendorRouter,
  CareContinuumRouter,
  ProblemRouter,
  AdmissionTypeRouter,
  CareContinuumLevelRouter,
  RaceRouter,
  MedicalAllergyRouter,
  MedicalPrecautionRouter,
  AdmissionGoalRouter,
  InterventionRouter,
  OutcomeRouter,
  GenderRouter,
  MaritalStatusRouter,
  ContactLabelRouter,
  PatientRouter,
  BedRouter,
  BedHistoryRouter,
  OrderSetRouter,
  OrderRouter,
  OrderMaintenanceRouter,
  ProductFrequencyRouter,
  ProductRouteRouter,
  ProductLotRouter,
} from "./modules";
import { startCampaignScheduler } from "./modules/email-marketing/services/campaign-send-service";
import { seedPurchaseStages } from "./modules/purchases";
import { seedSearchDestinations } from "./modules/search-destinations";

import admin from "firebase-admin";

// load .env variables
const PORT = process.env.SERVER_PORT || 8080;
const MONGO_DB_URL =
  process.env.MONGO_DB_URL || "mongodb://localhost:27017/bifi_app_db"; // default MongoDB URL for local development
const FIREBASE_SERVICE_ACCOUNT =
  process.env.FIREBASE_SERVICE_ACCOUNT || "../firebase-admin-sdk.json";

// Refuse to boot with RBAC disabled in production — authorization must be explicit.
if (
  process.env.NODE_ENV === "production" &&
  process.env.RBAC_ENABLE !== "true"
) {
  console.error(
    'FATAL: RBAC_ENABLE must be "true" when NODE_ENV=production. Aborting startup.',
  );
  process.exit(1);
}

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

// enable morgan — strip control characters to prevent log forging (M7)
const sanitizeLog = (s: string) => s.replace(/[\x00-\x1f\x7f-\x9f]/g, "");
app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      sanitizeLog(tokens.url(req, res) ?? ""),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  }),
);

// security headers (H5)
app.use(helmet());

// rate limiting on sensitive endpoints (H5)
// Skip public, high-frequency endpoints (translations, languages) that fire
// many requests per page load and don't carry user credentials.
const PUBLIC_SKIP_PATHS = new Set(["/translations/scope", "/languages"]);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: ({ url }) => PUBLIC_SKIP_PATHS.has(url.split("?")[0]),
  message: {
    error: true,
    message: "Too many requests, please try again later.",
  },
});

// enable cors — restrict to known frontend origins. (H4)
// CORS_ORIGINS is a comma-separated list (e.g. "http://localhost:4200,https://app.example.com").
// When unset/empty, falls back to localhost for dev. Production MUST set this.
const corsOriginsRaw = process.env.CORS_ORIGINS || "";
const corsOrigins =
  corsOriginsRaw.trim().length > 0
    ? corsOriginsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : ["http://localhost:4200", "http://localhost:8080"];
app.use(
  cors({
    origin: corsOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(express.json());

// public, unauthenticated email-marketing routes (tracking, unsubscribe, webhooks)
app.use("/api", new EmailMarketingPublicRouter().getRouter);

// public, unauthenticated CR E-Invoice Hacienda callback
app.use("/api", new CrEinvoicePublicRouter().getRouter);

// apply general API rate limiter to all authenticated routes
app.use("/api", apiLimiter);

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
app.use("/api", new RecurrentTaskRouter().getRouter);
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
app.use("/api", new ProgressNoteRouter().getRouter);
app.use("/api", new NoteRouter().getRouter);
app.use("/api", new ProgressNoteTagRouter().getRouter);
app.use("/api", new VitalSignRouter().getRouter);
app.use("/api", new VitalSignTypeRouter().getRouter);
app.use("/api", new FluidTrackRouter().getRouter);
app.use("/api", new FluidTrackItemRouter().getRouter);
app.use("/api", new StaffRouter().getRouter);
app.use("/api", new GroupRouter().getRouter);
app.use("/api", new ShiftRouter().getRouter);
app.use("/api", new VendorRouter().getRouter);
app.use("/api", new GenderRouter().getRouter);
app.use("/api", new MaritalStatusRouter().getRouter);
app.use("/api", new ContactLabelRouter().getRouter);
app.use("/api", new PatientRouter().getRouter);
app.use("/api", new BedRouter().getRouter);
app.use("/api", new BedHistoryRouter().getRouter);
app.use("/api", new CareContinuumRouter().getRouter);
app.use("/api", new ProblemRouter().getRouter);
app.use("/api", new AdmissionTypeRouter().getRouter);
app.use("/api", new CareContinuumLevelRouter().getRouter);
app.use("/api", new RaceRouter().getRouter);
app.use("/api", new MedicalAllergyRouter().getRouter);
app.use("/api", new MedicalPrecautionRouter().getRouter);
app.use("/api", new AdmissionGoalRouter().getRouter);
app.use("/api", new InterventionRouter().getRouter);
app.use("/api", new OutcomeRouter().getRouter);
app.use("/api", new OrderSetRouter().getRouter);
app.use("/api", new OrderRouter().getRouter);
app.use("/api", new OrderMaintenanceRouter().getRouter);
app.use("/api", new ProductFrequencyRouter().getRouter);
app.use("/api", new ProductRouteRouter().getRouter);
app.use("/api", new ProductLotRouter().getRouter);

// CR E-Invoice routes
app.use("/api", new CondicionVentaRouter().getRouter);
app.use("/api", new MedioPagoRouter().getRouter);
app.use("/api", new CrEinvoiceSettingsRouter().getRouter);
app.use("/api", new CrEinvoiceActionRouter().getRouter);

// health check route
app.get("/api/health-check", (req, res) => {
  res.status(200).json({
    message: "Welcome to the BIFI App Backend API",
    version: "202608191505",
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
