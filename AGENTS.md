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

## Key quirks
- **No tests, no linter, no formatter** configured in the project
- `mongoose.gen.ts` (12k+ lines) is **checked into git** — update it after model changes via `npm run generate:types`
- Path alias `@mongodb-types` maps to `src/types/mongoose.gen.ts` (configured in tsconfig `paths`)
- `dotenv.config()` runs inside `app.ts` (not `index.ts`)
- `dist/` is gitignored; build before commit if deployment depends on it
- Docker: multi-stage build, `node:22-slim`, port 8081, Chromium pre-installed for Puppeteer (`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`)
