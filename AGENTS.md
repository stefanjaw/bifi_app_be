# bifi_app_be — agent guide

## Stack
- Express 5 + Mongoose 8 + TypeScript + CommonJS
- Auth: Firebase Admin (credential from `FIREBASE_SERVICE_ACCOUNT` env var, JSON)
- File storage: GridFS, FTP, Google Drive
- Emails: SendGrid, Mailgun, Resend, AWS SES
- Puppeteer (Chromium) for PDF gen

## Dev commands
| Command | What |
|---|---|
| `npm run dev` | nodemon + ts-node (with tsconfig-paths), entry `src/index.ts` |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | `node dist/index.js` (prod) |
| `npm run generate:types` | Regenerates `src/types/mongoose.gen.ts` from all `*.model.ts` files via mongoose-tsgen |
| `npm run generate:graph` | dependency-cruiser → `graph.svg` |

## Architecture
- **Entrypoint**: `src/index.ts` calls `start()` from `src/app.ts`
- **Each domain module** lives in `src/modules/<name>/` with `controllers/`, `models/`, `routes/`, `services/`, and a barrel `index.ts`
- **All modules** re-exported through `src/modules/index.ts` (barrel)
- **Routes** extend `BaseRoutes<T>` and auto-register standard CRUD + CSV export/import + multer upload
- All routes are mounted at `/api` in `app.ts`; auth middleware runs before them (except public email-marketing & CR e-invoice routes)
- **Multi-tenancy**: `ConnectionManager` + `AsyncLocalStorage` (`userStorage`) switches DB per-request (`dbName` on store)

## Module catalog

All under `src/modules/<name>/`. Check this before adding new features — import existing logic instead of reimplementing.

| Module | What it manages | API endpoint(s) |
|---|---|---|
| `accounting` | chart of accounts, taxes, discounts, payment terms, fiscal positions, journals, journal entries (invoices), payments, settings | `/accounts`, `/taxes`, `/discounts`, `/payment-terms`, `/fiscal-positions`, `/journals`, `/journal-entries`, `/payments`, `/invoices`, `/accounting-settings` |
| `activity-history` | audit log / activity history for records | `/activity-histories` |
| `ai` | genai (prompt-based generation/streaming), gems (embedding-based generation/streaming/embedding) | `/genai/generate`, `/gems/generate`, `/gems/embed` |
| `ai-settings` | AI provider/model configuration | `/ai-settings` |
| `asset-commissioning` | asset commissioning records | `/asset-commissioning` |
| `asset-maintenance` | asset maintenance work orders | `/asset-maintenances` |
| `asset-roster` | asset register / equipment roster with CSV import/export and status management | `/asset-rosters` |
| `asset-types` | asset type classifications | `/asset-types` |
| `bcd` | Bill of Customs Declaration documents with FTP data exchange | `/bcds` |
| `bcd-additional-information-types` | lookup: BCD additional information types | `/bcd-additional-information-types` |
| `bcd-charge-codes` | lookup: BCD charge codes | `/bcd-charge-codes` |
| `bcd-cpcs` | lookup: BCD Customs Procedure Codes | `/bcd-cpcs` |
| `bcd-ports` | lookup: BCD ports | `/bcd-ports` |
| `bcd-tax-ids` | lookup: BCD tax ID types | `/bcd-tax-ids` |
| `bcd-tax-types` | lookup: BCD tax types | `/bcd-tax-types` |
| `bcd-transport-options` | lookup: BCD transport options | `/bcd-transport-options` |
| `bcd-types` | lookup: BCD document types | `/bcd-types` |
| `branch-office` | branch/office locations for multi-entity orgs | `/branch-offices` |
| `companies` | company/organization profiles | `/companies` |
| `contacts` | contact/person records (shared by CRM, suppliers, etc.) | `/contacts` |
| `countries` | reference country list | `/countries` |
| `crm` | CRM deals/opportunities pipeline | `/crm` |
| `crm-stages` | CRM pipeline stage definitions | `/crm-stages` |
| `currency` | reference currency list | `/currencies` |
| `currency-exchange-rate` | currency exchange rates | `/exchange-rates` |
| `customs-chapters` | customs tariff chapter reference data | `/customs-chapters` |
| `customs-headings` | customs tariff heading reference data | `/customs-headings` |
| `customs-tariffs` | customs tariff line-item reference data | `/customs-tariffs` |
| `drive-settings` | Google Drive service account configuration | `/drive-settings` |
| `email-marketing` | email templates, mailing lists, subscribers, campaigns, events (opens/clicks/bounces), settings + public unsubscribe/tracking/ESP webhooks | `/email-templates`, `/mailing-lists`, `/subscribers`, `/email-campaigns`, `/email-events`, `/email-settings` |
| `facilities` | facilities and rooms | `/facilities`, `/rooms` |
| `files` | file upload/download via GridFS | `/files` |
| `helpdesk-stages` | helpdesk/ticket pipeline stage definitions | `/helpdesk-stages` |
| `inventory` | products, warehouses, locations, stock balances, stock movements, UOMs, UOM categories, product types | `/products`, `/warehouses`, `/locations`, `/stock-balances`, `/stock-movements`, `/uoms`, `/uom-categories`, `/product-types` |
| `l10n_cr_einvoice` | Costa Rica electronic invoice plugin (Hacienda FE) | `/cr-einvoice/...` (see Localization plugins below) |
| `maintenance-windows` | scheduled maintenance time windows | `/maintenance-windows` |
| `models` | Mongoose model registry introspection | `/models` |
| `notification-settings` | per-user per-event notification preferences | `/notification-settings` |
| `notifications` | in-app notification records with read/unread | `/notifications` |
| `pricing-estimates` | pricing estimates with PDF/CSV generation and pricing engine | `/pricing-estimates` |
| `pricing-index` | pricing index search over catalog + freight caches, file parsing, Google Drive ingestion | `/pricing-index` |
| `projects` | project records | `/projects` |
| `project-stages` | project pipeline stage definitions | `/project-stages` |
| `purchases` | suppliers, purchase orders, purchase settings | `/suppliers`, `/purchase-orders`, `/purchase-settings` |
| `purchase-stages` | purchase order pipeline stage definitions | `/purchase-stages` |
| `report-bug` | bug report submission (creates a ticket) | `/report-bug` |
| `reporting` | generated report records | `/reporting` |
| `roles` | RBAC roles and policies (permission definitions) | `/roles`, `/policies` |
| `sales` | sales dashboard + sales settings | `/sales/dashboard`, `/sales/settings` |
| `sales-orders` | sales orders with PDF export | `/sales-orders` |
| `sales-order-stages` | sales order pipeline stage definitions | `/sales-order-stages` |
| `sales-targets` | sales target/goal records | `/sales-targets` |
| `search-destinations` | search destinations (indexed models) + unified app-wide search | `/search-destinations`, `/search` |
| `sequences` | auto-incrementing document numbering sequences | `/sequences` |
| `shipping` | shipping records with HS code lookup, tariff generation, import from file | `/shippings` |
| `tasks` | task records | `/tasks` |
| `task-stages` | task pipeline stage definitions | `/task-stages` |
| `task-types` | task type definitions | `/task-types` |
| `templates` | reusable document/email templates | `/templates` |
| `tickets` | helpdesk tickets and ticket rules (auto-assignment/SLA) | `/tickets`, `/ticket-rules` |
| `users` | user accounts, profile (`/me`), and user management | `/users` |
| `user-shortcuts` | per-user shortcut/favorites configuration | `/user-shortcuts` |

## System infrastructure (`src/system/`)

Everything re-exported through `src/system/index.ts` and importable via `"../../system"`.

### Base CRUD scaffolding
- **`BaseController<T>`** — Thin Express handlers (`getById`, `get`, `create`, `update`, `delete`, `exportCSV`, `importCSV`). Parse request, call service, respond.
- **`BaseService<T>`** — Wraps `PaginateModel<T>`. Every method auto-binds to tenant DB via `ConnectionManager` and runs inside `runTransaction()`. Provides `transformReferenceFilters` for dot-notation cross-model filtering (configured via `refFields`).
- **`BaseRoutes<T>`** — Registers `GET /endpoint`, `GET /endpoint/:id`, `POST`, `PUT`, `DELETE`, `GET /endpoint/export`, `POST /endpoint/import`. Injects `authorizeMiddleware`, `validateBodyMiddleware`, multer upload, and CSV validation automatically.

**Always extend these instead of writing raw Express handlers.**

### Error handling
- `ServiceException` hierarchy with classes for HTTP 400–500 errors (`ValidationException`, `NotFoundException`, `ForbiddenException`, etc.)
- `catchExceptionMiddleware` (last in middleware chain) formats `ServiceException` → structured JSON. **Never throw raw `Error` — always use `throw new XxxException(...)`.**

### DTO validation
- `PartialType(CreateDTO)` generates `UpdateDTO` with all optional fields — used in every module.
- `@Transform(toBoolean)` for boolean query/number-string coercion — used in ~25+ DTOs.
- `validateBodyMiddleware(dtoClass)` runs `class-validator` + `class-transformer` on req.body, throws `ValidationException` with structured errors on failure.

### File handling
- `FileValidatorService` — validates type + size (5MB limit) before upload.
- `GridFSBucketService` — upload/download to MongoDB GridFS (`bifi_app_files` bucket). Instantiated via `ConnectionManager.bindBucketToDb()`.
- `FTPService` — Singleton; must call `FTPService.initiate(config)` once at startup (done in `app.ts`).
- `GoogleDriveConnectorService` — list/download/upload/export Google Sheets from service account.
- `fileSchema` — Mongoose subdocument schema for embedded file references (used in `asset-maintenance`, `bcd`, `product`, `ticket`, `journal-entry` models).
- `FileUpload` / `InnerFile` types — used in DTOs and services to represent uploaded files.
- `isMulterFile()` / `isValidFileUpload()` — type guards for Multer ↔ InnerFile discrimination.

### Middleware chain (in order)
1. `userStorage.run(...)` — initializes per-request context (every request in `app.ts`)
2. `EmailMarketingPublicRouter`, `CrEinvoicePublicRouter` — registered **before** auth (no token required)
3. `authenticateMiddleware(userService)` — verifies Firebase JWT, sets `userStorage` (user, token, dbName). Creates user on first login. Reads `dbname` header for tenant routing.
4. `authorizeMiddleware(resource, action)` — checks RBAC policies against user roles (can be skipped by setting `RBAC_ENABLE=false`)
5. `validateBodyMiddleware(dtoClass)` — DTO validation
6. Route handler → `catchExceptionMiddleware` (catches all errors)

### Transactions
Every `BaseService` method wraps in `runTransaction(session, callback)`. Custom service methods should also accept an optional `session` parameter and wrap work in `runTransaction`.

### Price calculator
`src/system/libraries/orders/price-calculator.ts` exports `calculateLineItemTotal`, `calculateSubtotal`, `calculateTaxes`, `calculateTaxesPerLine`, `calculateGrandTotal` for purchase/sales order pricing. **Do not reimplement.**

### Localization plugins

Each l10n module lives in `src/modules/l10n_<locale>/` and extends a core module by providing region-specific business logic, API integrations, and reference data.

**`src/modules/l10n_cr_einvoice/`** — Costa Rica electronic invoice (FE/Hacienda) plugin.

- **Relationship with `accounting/`**: CR fields (`crEinvoiceType`, `crClave`, `crCondicionVentaId`, etc.) live on the `JournalEntry` model in `accounting/`. This module provides the Hacienda-specific enums, constants, and business logic that `accounting/` imports. It enriches the invoice — it does not own it.

- **Submodules**:
  - `condicion-venta/`, `medio-pago/` — CRUD for Hacienda-mandated lookup tables (sales conditions, payment methods). Models prefixed `Cr`.
  - `settings/` — Singleton config (Hacienda credentials, P12 certificate, establishment/POS codes).
  - `services/` — Hacienda API auth, payload submission, status polling, XML JSON builder, PDF generator (Puppeteer), received-invoice import (XML parser + auto-contact/product creation).
  - `routes/` — Action endpoints (`submit-einvoice`, `poll-status`, `create-note`, `submit-acceptance`, `import-received`) + public Hacienda callback (registered **before** auth middleware in `app.ts`).
  - `utils/` — `cr-clave-builder` (50-char Hacienda Clave & 20-char Consecutivo), `cr-constants` (shared enums: document types, statuses, tax conditions).

- **Key API endpoints** (all under `/api/cr-einvoice/`):
  - `GET/PUT /settings` — CR E-Invoice configuration
  - `POST /import-received` — Import signed XML from Hacienda
  - `POST /:id/submit-einvoice` — Submit to Hacienda
  - `POST /:id/poll-einvoice-status` — Check Hacienda acceptance
  - `POST /:id/create-note` — Generate credit/debit note (NC/ND)
  - `POST /:id/submit-acceptance` — Submit MA/MAP/MR message
  - `POST /hacienda-callback` — Public webhook (no auth)

## Key quirks
- **No tests, no linter, no formatter** configured in the project
- `mongoose.gen.ts` (12k+ lines) is **checked into git** — update it after model changes via `npm run generate:types`
- Path alias `@mongodb-types` maps to `src/types/mongoose.gen.ts` (configured in tsconfig `paths`)
- `dotenv.config()` runs inside `app.ts` (not `index.ts`)
- `dist/` is gitignored; build before commit if deployment depends on it
- Docker: multi-stage build, `node:22-slim`, port 8081, Chromium pre-installed for Puppeteer (`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`)
