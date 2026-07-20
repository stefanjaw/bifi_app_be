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
- **All modules** use a consistent flat structure under `src/modules/<name>/` with `controllers/`, `models/`, `routes/`, `services/`, and a barrel `index.ts`
- **All modules** re-exported through `src/modules/index.ts` (barrel)
- **Routes** extend `BaseRoutes<T>` and auto-register standard CRUD + CSV export/import + multer upload
- All routes are mounted at `/api` in `app.ts`; auth middleware runs before them (except public email-marketing & CR e-invoice routes)
- **Multi-tenancy**: `ConnectionManager` + `AsyncLocalStorage` (`userStorage`) switches DB per-request (`dbName` on store)

### Module Structure

Every module follows this exact layout (except `l10n_cr_einvoice` which is a localization plugin with additional `utils/` and nested submodules):

```
src/modules/<module-name>/
  controllers/       -- Express handlers extending BaseController<T>
  models/            -- Mongoose schemas (*.model.ts) and DTOs (*.dto.ts)
  routes/            -- Route definitions extending BaseRoutes<T>
  services/          -- Business logic extending BaseService<T>
  index.ts           -- Barrel re-exporting all public symbols
```

Cross-module imports use `../../<other-module>/services/<name>` from any file within a module's `controllers/`, `models/`, `routes/`, or `services/`. System infrastructure imports use `../../../system`.

Related sub-entities live in the same parent module (flat, not nested). For example, `asset-roster` contains commissioning, maintenance, and asset-types as flat files in its `controllers/`, `models/`, `routes/`, `services/` directories — not as nested subdirectories.

### One Class Per File Rule

Every file in `controllers/`, `services/`, and `routes/` must contain **exactly one class** corresponding to one entity. This applies to ALL entities within a module, including lookups, sub-entities, and related models.

**Allowed:**
```
controllers/
  gender-controller.ts       -- class GenderController (extends BaseController<Gender>)
  marital-status-controller.ts -- class MaritalStatusController (extends BaseController<MaritalStatus>)
  patient-controller.ts      -- class PatientController (extends BaseController<Patient>)
services/
  gender-service.ts          -- class GenderService (extends BaseService<Gender>)
  marital-status-service.ts  -- class MaritalStatusService (extends BaseService<MaritalStatus>)
  patient-service.ts         -- class PatientService (extends BaseService<Patient>)
routes/
  gender-routes.ts           -- class GenderRoutes (extends BaseRoutes<Gender>)
  marital-status-routes.ts   -- class MaritalStatusRoutes (extends BaseRoutes<MaritalStatus>)
  patient-routes.ts          -- class PatientRoutes (extends BaseRoutes<Patient>)
```

**NOT allowed** — multiple controllers/services/routes in a single file:
```
controllers/lookup-controllers.ts   -- GenderController + MaritalStatusController + ... ❌
services/lookup-services.ts          -- GenderService + MaritalStatusService + ... ❌
routes/lookup-routes.ts              -- GenderRoutes + MaritalStatusRoutes + ... ❌
models/lookups.dto.ts                -- GenderDTO + MaritalStatusDTO + ... ❌
models/lookups.model.ts              -- GenderSchema + MaritalStatusSchema + ... ❌
```

**Exception:** The `models/` directory may accept co-located DTOs (`<entity>.dto.ts`) and model schemas (`<entity>.model.ts`) — though one-per-file is preferred. DTOs with trivial `PartialType(UpdateDTO)` can share a file with the main DTO.

### Entity Relationships — Inherit, Don't Duplicate

When creating a new entity that extends or relates to an existing entity in the same module, **inherit from or reference the existing entity** rather than duplicating its fields, DTOs, and service logic.

- **Use reference IDs** (`ref` + `ObjectId`) to link related entities instead of copying the same fields across multiple schemas.
- **Use schema composition** (spread operator or `Schema.add()`) when a child entity genuinely shares a common subset of fields.
- **Extend DTOs** via `PartialType` or intersection types rather than re-declaring the same validation decorators.
- **Reuse service methods** from the parent entity's service instead of reimplementing identical CRUD logic.

**Anti-pattern** (avoid — duplicates fields, DTOs, and service logic unnecessarily):
```
Task:          name, description, assignees, tags, stage, priority, ...
RecurrentTask: title, description, assignees, tags, stage, priority, ...  // same fields re-declared
```

**Preferred pattern** (reference or inherit):
```
Task:          name, description, assignees, tags, stage, priority, ..., recurrentTaskId → RecurrentTask
RecurrentTask: repetitionSequence, repetitionLapse, repetitionDays, ...  // only unique fields
```

**Exception — same-shaped fields, different domain**: Stage/pipeline entities for different modules (e.g. `TaskStage`, `HelpdeskStage`, `SalesOrderStage`, `ProjectStage`) may have structurally identical fields (`name`, `sequence`, `color`, `isDefault`) yet remain **separate models** because each belongs to a distinct business domain. Their field shapes happen to coincide — they are not duplicates of each other. Do not merge them into a single generic "stage" model.

**Exception — standalone entities**: Entities that share no meaningful relationship with existing entities may be created independently. When in doubt, prefer composition over duplication.

## Module catalog

All under `src/modules/<name>/`. Check this before adding new features — import existing logic instead of reimplementing. Each module may contain multiple related entities; all share the same flat `controllers/`, `models/`, `routes/`, `services/` structure.

| Module | What it manages | API endpoint(s) |
|---|---|---|
| `accounting` | chart of accounts, taxes, discounts, payment terms, fiscal positions, journals, journal entries (invoices), payments, settings | `/accounts`, `/taxes`, `/discounts`, `/payment-terms`, `/fiscal-positions`, `/journals`, `/journal-entries`, `/payments`, `/invoices`, `/accounting-settings` |
| `activity-history` | audit log / activity history for records | `/activity-histories` |
| `ai` | genai (prompt-based generation/streaming), gems (embedding-based generation/streaming/embedding), AI provider/model configuration | `/genai/generate`, `/gems/generate`, `/gems/embed`, `/ai-settings` |
| `asset-roster` | asset register / equipment roster with CSV import/export, asset commissioning, asset maintenance work orders, asset type classifications, status management | `/asset-rosters`, `/asset-commissioning`, `/asset-maintenances`, `/asset-types` |
| `bcd` | Bill of Customs Declaration documents with FTP data exchange + 8 lookup tables (additional information types, charge codes, CPCs, ports, tax IDs, tax types, transport options, document types) | `/bcds`, `/bcd-additional-information-types`, `/bcd-charge-codes`, `/bcd-cpcs`, `/bcd-ports`, `/bcd-tax-ids`, `/bcd-tax-types`, `/bcd-transport-options`, `/bcd-types` |
| `branch-office` | branch/office locations for multi-entity orgs | `/branch-offices` |
| `companies` | company/organization profiles | `/companies` |
| `contacts` | contact/person records (shared by CRM, suppliers, etc.) | `/contacts` |
| `countries` | reference country list | `/countries` |
| `crm` | CRM deals/opportunities pipeline + pipeline stage definitions | `/crm`, `/crm-stages` |
| `currency` | reference currency list + currency exchange rates | `/currencies`, `/exchange-rates` |
| `customs` | customs tariff reference data (chapters, headings, line-item tariffs) | `/customs-chapters`, `/customs-headings`, `/customs-tariffs` |
| `drive-settings` | Google Drive service account configuration | `/drive-settings` |
| `email-marketing` | email templates, mailing lists, subscribers, campaigns, events (opens/clicks/bounces), settings + public unsubscribe/tracking/ESP webhooks | `/email-templates`, `/mailing-lists`, `/subscribers`, `/email-campaigns`, `/email-events`, `/email-settings` |
| `facilities` | facilities and rooms | `/facilities`, `/rooms` |
| `files` | file upload/download via GridFS | `/files` |
| `helpdesk` | helpdesk tickets, ticket rules (auto-assignment/SLA), ticket pipeline stage definitions | `/tickets`, `/ticket-rules`, `/helpdesk-stages` |
| `inventory` | products, warehouses, locations, stock balances, stock movements, UOMs, UOM categories, product types, inventory settings | `/products`, `/warehouses`, `/locations`, `/stock-balances`, `/stock-movements`, `/uoms`, `/uom-categories`, `/product-types`, `/inventory-settings` |
| `l10n_cr_einvoice` | Costa Rica electronic invoice plugin (Hacienda FE) — **only module with nested subdirectory structure** | `/cr-einvoice/...` (see Localization plugins below) |
| `maintenance-windows` | scheduled maintenance time windows | `/maintenance-windows` |
| `models` | Mongoose model registry introspection | `/models` |
| `notifications` | in-app notification records with read/unread + per-user per-event notification preferences | `/notifications`, `/notification-settings` |
| `pricing` | pricing estimates with PDF/CSV generation and pricing engine + pricing index search over catalog & freight caches, file parsing, Google Drive ingestion | `/pricing-estimates`, `/pricing-index` |
| `projects` | project records + project pipeline stage definitions | `/projects`, `/project-stages` |
| `purchases` | suppliers, purchase orders, purchase settings + purchase pipeline stage definitions | `/suppliers`, `/purchase-orders`, `/purchase-settings`, `/purchase-stages` |
| `report-bug` | bug report submission (creates a ticket) | `/report-bug` |
| `reporting` | generated report records | `/reporting` |
| `roles` | RBAC roles and policies (permission definitions) | `/roles`, `/policies` |
| `sales` | sales dashboard + sales settings, sales orders with PDF export, sales order pipeline stages, sales target/goal records | `/sales/dashboard`, `/sales/settings`, `/sales-orders`, `/sales-order-stages`, `/sales-targets` |
| `search-destinations` | search destinations (indexed models) + unified app-wide search | `/search-destinations`, `/search` |
| `sequences` | auto-incrementing document numbering sequences | `/sequences` |
| `shipping` | shipping records with HS code lookup, tariff generation, import from file | `/shippings` |
| `tasks` | task records, task pipeline stages, task types, recurring task scheduling | `/tasks`, `/task-stages`, `/task-types`, `/recurrent-tasks` |
| `templates` | reusable document/email templates | `/templates` |
| `translations` | UI translation key-value storage (locale, scope, key, value) + language definitions | `/translations`, `/languages` |
| `users` | user accounts, profile (`/me`), user management, per-user shortcut/favorites — language/locale field + `/me/language` endpoint | `/users`, `/user-shortcuts` |
| `care-continuum` | care continuum records + problems + lookups (admission types, levels, races, medical allergies, medical precautions) | `/care-continuums`, `/care-continuum-problems`, `/admission-types`, `/care-continuum-levels`, `/races`, `/medical-allergies`, `/medical-precautions` |
| `care-plan` | clinical care plan (admission goals, interventions, outcomes) | `/admission-goals`, `/interventions`, `/outcomes` |
| `clinical-orders` | clinical orders, order sets, order maintenances | `/orders`, `/order-sets`, `/order-maintenances` |
| `progress-notes` | progress notes, notes, progress note tags | `/progress-notes`, `/notes`, `/progress-note-tags` |
| `vital-signs` | vital signs measurements + vital sign type definitions | `/vital-signs`, `/vital-sign-types` |
| `fluid-tracks` | fluid intake/output tracking + fluid track items | `/fluid-tracks`, `/fluid-track-items` |
| `staff` | staff records, staff groups, shifts | `/staff`, `/staff-groups`, `/shifts` |
| `vendors` | vendor records | `/vendors` |
| `contacts` (extended) | contacts, patients, genders, marital statuses, contact labels | `/contacts`, `/patients`, `/genders`, `/marital-statuses`, `/contact-labels` |
| `facilities` (extended) | facilities, rooms, beds, bed history | `/facilities`, `/rooms`, `/beds`, `/bed-histories` |
| `inventory` (extended) | products, product types, UOMs, UOM categories, warehouses, locations, stock balances, stock movements, product frequencies, product routes, product lots | `/inventory/products`, `/product-types`, `/uoms`, `/uom-categories`, `/warehouses`, `/locations`, `/stock-balances`, `/stock-movements`, `/product-frequencies`, `/product-routes`, `/product-lots` |

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
- **`@Transform(toBoolean)` is required on every `boolean` DTO field** — the frontend sends FormData, which serializes booleans as strings `"true"`/`"false"`. Without `@Transform(toBoolean)`, `@IsBoolean()` will reject valid input. Import from `"../../../system"`. Used in ~25+ DTOs.
- `validateBodyMiddleware(dtoClass)` runs `class-validator` + `class-transformer` on req.body, throws `ValidationException` with structured errors on failure.
- **Sub-objects used as DTO fields MUST be their own DTO classes** (not plain interfaces or inline types). Each sub-object DTO must have full `class-validator` decorators on every field. Reference: `src/modules/asset-roster/models/asset-roster.dto.ts` — `LocationAssignmentDTO`, `SoftwareConfigurationDTO`, `NotesDTO`, `makeInformationDTO`, `assetTypeInformationDTO` are all standalone DTO classes with decorators.
  - In the parent DTO, declare the sub-DTO field with `@ValidateNested()` (or `@ValidateNested({ each: true })` for arrays), `@Type(() => SubDTO)`, and `@Transform(({ value }) => plainToInstance(SubDTO, typeof value === "string" ? JSON.parse(value) : value))` for FormData support.
  - Sub-DTOs that extend another module's DTO (e.g. `makeInformationDTO extends ContactDTO`) should add only the extra fields needed, plus `@IsMongoId() @IsOptional() _id?: string` for create-vs-update reference.
  - The `@Transform` for FormData must handle both string (from multipart form) and already-parsed object (from JSON body).

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

### Permission & Authorization System

The backend enforces the same RBAC/PBAC model as the frontend: Policy → Role → User. Authorization is wired at the route level via `authorizeMiddleware`.

#### How authorizeMiddleware Works

All routes registered through `BaseRoutes<T>` automatically wrap each endpoint with `authorizeMiddleware(resource, action)`. The middleware:

1. Checks `RBAC_ENABLE` env var (default: `true`; when `false`, all checks are skipped)
2. Gets the current user from `userStorage` (populated by `authenticateMiddleware`)
3. Flattens `user.roles[].policies[]` and filters where:
   - `policy.policyId.resource === resource`
   - `policy.actions.includes(action)`
   - `policy.policyId.type === "model"` (only `"model"` type is enforced server-side)
4. If no matching policies → throws `UnauthorizedException`
5. For each matching policy, evaluates `conditions[]` against the resource document (fetched via the optional `getDocument` callback)
6. If any policy passes all conditions → `next()`. Otherwise → `UnauthorizedException`

Only `type: "model"` policies are enforced server-side. `"view"` and `"menu"` types are frontend-only — they are never evaluated by this middleware.

#### Resource Naming — MUST Match Frontend

The `resource` string passed to `authorizeMiddleware` must match the frontend's resource naming exactly. The `BaseRoutes` constructor receives the resource name and auto-wires it for all standard CRUD endpoints.

| Backend Module | resource name | Example endpoints |
|---|---|---|
| `asset-roster` | `asset-rosters` | `GET /api/asset-rosters`, `POST /api/asset-rosters` |
| `facilities` | `facilities` | `GET /api/facilities`, `PUT /api/facilities` |
| `maintenance-windows` | `maintenance-windows` | `GET /api/maintenance-windows` |
| `roles` | `roles` | `GET /api/roles`, `POST /api/roles` |
| `policies` | `policies` | `GET /api/policies`, `POST /api/policies` |

#### Auto-wired Permissions in BaseRoutes

`BaseRoutes.initRoutes()` registers these standard `authorizeMiddleware` checks for every module:

| Route | Middleware call |
|---|---|
| `GET /{endpoint}/export` | `authorizeMiddleware(\`${resource}/export\`, "read")` |
| `GET /{endpoint}/:id` | `authorizeMiddleware(resource, "read")` |
| `GET /{endpoint}` | `authorizeMiddleware(resource, "read")` |
| `POST /{endpoint}` | `authorizeMiddleware(resource, "create")` |
| `POST /{endpoint}/import` | `authorizeMiddleware(\`${resource}/import\`, "create")` |
| `PUT /{endpoint}` | `authorizeMiddleware(resource, "update")` |
| `DELETE /{endpoint}` | `authorizeMiddleware(resource, "delete")` |

#### Row-Level Security (Conditions)

For row-level access control, pass a `getDocument` callback as the third argument to `authorizeMiddleware`:

```ts
authorizeMiddleware('asset-rosters', 'read', async (req) => {
  const asset = await AssetRosterModel.findById(req.params.id);
  return asset?.toObject() ?? {};
})
```

Then create a policy in the admin UI with conditions:
- **Key**: `assignedTo`
- **Operator**: `==`
- **Value**: `{{user.id}}`

This restricts the user to only records where `assignedTo` equals their own `_id`.

**Supported operators**: `==`, `!=`, `>`, `<`, `in`

**Template resolution**: `{{user.*}}`, `{{resource.*}}`, `{{context.*}}` are resolved at runtime against the document, user, and context respectively.

#### Manual authorizeMiddleware Usage

For custom action routes that bypass `BaseRoutes`:

```ts
router.get(
  '/custom-action',
  authenticateMiddleware(userService),
  authorizeMiddleware('my-resource', 'read'),
  handler
);
```

#### Adding a New Module: Permission Checklist

1. **Create the module** with `BaseController` + `BaseService` + `BaseRoutes`
2. **In `BaseRoutes` constructor**, pass the resource string: `super('asset-rosters', ...)` — this must match the frontend's resource naming
3. **Create policies** in the admin UI (Settings → Policies) with matching resource names
4. **Assign policies to roles**, roles to users in the admin UI
5. **For custom routes**, manually add `authorizeMiddleware(resource, action)` before the handler
6. **For row-level access**, provide a `getDocument` callback to `authorizeMiddleware`

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

### PDF Services — Hardcoded Locales

| Service | `<html lang>` | Date locale | Status labels |
|---|---|---|---|
| `purchases/services/purchase-order-pdf-service.ts` | `"en"` | `"en-US"` | English: "Draft", "Confirmed", etc. |
| `sales/services/sales-order-pdf-service.ts` | `"en"` | `"en-US"` | English: "Draft", "Quote", etc. |
| `pricing/services/pdf-generator-service.ts` | `"en"` | Default (no locale) | English |
| `l10n_cr_einvoice/services/cr-einvoice-pdf.service.ts` | `"es"` | `"es-CR"` | Spanish: "FACTURA ELECTRÓNICA", "Emisor", etc. |

### CR Validator — Hardcoded Spanish

`l10n_cr_einvoice/services/cr-einvoice-validator.service.ts` has ~40 validation error messages hardcoded in Spanish (277-line file, entirely Spanish).

## Extending Existing Entities — Backend Pattern

When adding fields to an existing entity (e.g., locale-specific fields, domain-specific clinical metadata), follow the `l10n_cr_einvoice` pattern:

### 1. Distinguish Entity Types

| Type | What to do | Example |
|---|---|---|
| **Genuinely new entity** | Create fresh in its own module | `product-frequency`, `product-route`, `product-lot` |
| **Extension of existing entity** | Add prefixed fields to the **core entity's schema** — the extension module provides only business logic | `cr*` fields on Product, Uom, Contact, JournalEntry |
| **Duplicate of existing entity** | Delete and redirect refs — never reimplement | `clinical-product` (was duplicate of `product`) |

### 2. Field Prefix Convention

Extension fields **must** use a module-specific prefix to namespace them and prevent collisions. The prefix can be anything unique to the module:

```ts
// l10n_cr_einvoice uses "cr" — Costa Rica
crVatType, crUnidadMedida, crPartidaArancelaria, crEinvoiceType, crClave

// Another module might use a different prefix, e.g. "mx" for Mexico, "cl" for clinical
// The exact prefix doesn't matter — only that it's unique per module
```

The prefix makes ownership obvious at a glance. Without one, a future extension could collide with core fields or another module's fields.

**Do NOT prefix** fields that are conceptually intrinsic to the entity across all deployments — only prefix fields added by an external module that may not be relevant in all contexts.

### 2a. Schema Has the Fields — Core Frontend Interface Does NOT

The Mongoose schema **must** include the extension fields (statically defined). But the corresponding frontend core interface must **not** define them:

```
Backend schema (bifi_app_be):                product.model.ts  → has clStrengths, clRouteIds, ...
Frontend core interface (@avalantec/inventory):  product.ts      → NO cl* fields
Frontend extension (@avalantec/clinical):        plugin component → (product as any)?.clStrengths
```

The frontend extension module uses `(entity as any)?.clFieldName` in its plugin components — the core interface stays clean. This makes the extension optional: a deployment without the clinical module never sees the `cl*` fields.

### 3. Static Schema Fields — Not Dynamic Injection

Extension fields are **statically defined** on the core entity's Mongoose schema file. They are NOT injected via a plugin/extension registry:

```
bifi_app_be/src/modules/inventory/models/product.model.ts    → codigoComercial, crPartidaArancelaria, productKind
bifi_app_be/src/modules/inventory/models/uom.model.ts       → crUnidadMedida
bifi_app_be/src/modules/contacts/models/contact.model.ts    → crVatType, commercialName, crDistrito, crEconomicActivityCodes
bifi_app_be/src/modules/accounting/models/tax.model.ts      → crCodigo, crCodigoTarifa, crTarifa
bifi_app_be/src/modules/accounting/models/journal-entry.model.ts → crEinvoiceType, crClave, crCondicionVentaId, crMedioPagoId, etc.
```

**The extension module (`l10n_cr_einvoice`) does NOT touch these schema files.** It provides:
- Hacienda-specific business logic (JSON/XML builders, API submission, PDF gen, validation)
- Reference lookup tables (`CrCondicionVenta`, `CrMedioPago`, `CrEinvoiceSettings`)
- Action endpoints (`submit-einvoice`, `poll-status`, `create-note`, etc.)

The core module (e.g., `accounting`) owns the data. The extension module enriches it.

### 4. Cross-Model References

Extension fields often reference lookup models from the extension module:

```ts
// in accounting/models/journal-entry.model.ts
crCondicionVentaId: {
  type: Schema.Types.ObjectId,
  ref: "CrCondicionVenta",   // ← model defined in l10n_cr_einvoice
  // ...
}
```

These are standard Mongoose `ref` ObjectId fields with `autopopulate`.

### 5. Reference Implementation

See `src/modules/l10n_cr_einvoice/` for the canonical example:
- `condicion-venta/`, `medio-pago/`, `settings/` — standalone sub-modules following standard CRUD pattern
- `services/` — business logic that reads the `cr*` fields from core models
- `routes/cr-einvoice-action-routes.ts` — action endpoints that operate on JournalEntry `cr*` fields

### Number Formatting

All number formatting uses `.toFixed(2)` or `.toFixed(5)` — no `Intl.NumberFormat` usage.

### Translation & Languages

**Phase 1 (implemented).** Backend-driven translation system using MongoDB-backed storage:

- **`src/modules/translations/`** — Translation model (`{ locale, scope, key, value, active }`) + Language entity (`{ locale, name, nativeName, active }`)
- **Endpoints:**
  - `GET /api/translations/scope?locale=:locale&scope=:scope` — scope-based key-value read (public, no auth required)
  - Standard CRUD on `/api/translations` and `/api/languages` for admin management
- **User language preference:**
  - `language` field (string, default `"en"`) on User model + `UserDTO`
  - `UpdateLanguageDTO` + `PUT /api/users/me/language` — updates user language and refreshes `userStorage.locale`
  - `userStorage.locale` set from `user.language` in auth middleware (line 168 of `authenticate-middleware.ts`)
**Remaining work (Phase 2):**
- PDF services accept `locale` parameter instead of hardcoded values
- `ValidationMessageService` for `CrEinvoiceValidatorService`
- Template string extraction from UI into translation keys

## Documentation (JSDoc)

**Documenting code is mandatory** — every public method, exported function, interface, type, and class must have a JSDoc comment (`/** ... */`) explaining its purpose, parameters, and return value.

### Rules

- **All public/exported functions and methods** must have JSDoc — includes controller handlers, service methods, route definitions, utility functions, and DTO class declarations
- **Private methods with non-trivial logic** should also have JSDoc
- **Interfaces and types** should have JSDoc if their purpose is not immediately obvious from the name
- **Keep JSDoc concise** — one line summary is sufficient for simple methods. **Always include `@param` and `@returns`** when the method has parameters or a non-`void` return value
- **Never add JSDoc to overrides** of `BaseController`, `BaseService`, or `BaseRoutes` methods unless the override adds non-trivial behavior

### Examples

```ts
/**
 * Fetches all payments registered against a specific invoice
 * @param invoiceId - The invoice ID
 * @returns Promise of payment records
 */
async getPayments(invoiceId: string): Promise<Payment[]> { ... }

/** Logs out the current user by clearing the session and calling Firebase signOut */
async logout(): Promise<void> { ... }

/**
 * Validates that at least one contact method is provided.
 * Throws ValidationException if all contact fields are empty.
 * @param contact - The contact DTO to validate
 * @throws {ValidationException} When no phone, email, or website is provided
 */
validateContactMethod(contact: ContactDTO): void { ... }
```

### Enforcement

- All new code must include JSDoc per these rules
- When editing existing code, add missing JSDoc to nearby functions if you touch them
- Keep documentation in sync with the code — outdated docs are worse than no docs

## Key quirks
- **No tests, no linter, no formatter** configured in the project
- `mongoose.gen.ts` (12k+ lines) is **checked into git** — update it after model changes via `npm run generate:types`
- Path alias `@mongodb-types` maps to `src/types/mongoose.gen.ts` (configured in tsconfig `paths`)
- **Every `.model.ts` file MUST import and use the generated TypeScript type from `@mongodb-types`** for the model's document type (e.g., `import { ContactDocument } from "@mongodb-types"`). Do NOT manually declare document interfaces — mongoose-tsgen generates them from the schema. The generated type is used as the generic parameter for `mongoose.model<T, PaginateModel<T>>()` and in controllers/services.
- `dotenv.config()` runs inside `app.ts` (not `index.ts`)
- `dist/` is gitignored; build before commit if deployment depends on it
- Docker: multi-stage build, `node:22-slim`, port 8081, Chromium pre-installed for Puppeteer (`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`)

## Task Tracking

**MANDATORY**: When working on tasks in this codebase, you MUST mark each task as **completed** immediately after finishing it. Do not leave tasks in an ambiguous or "in_progress" state. If a task cannot be completed, mark it as **blocked** or **cancelled** with a clear reason. The person reviewing your work should always know exactly what is done and what isn't without having to ask.
