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

## Key quirks
- **No tests, no linter, no formatter** configured in the project
- `mongoose.gen.ts` (12k+ lines) is **checked into git** — update it after model changes via `npm run generate:types`
- Path alias `@mongodb-types` maps to `src/types/mongoose.gen.ts` (configured in tsconfig `paths`)
- `dotenv.config()` runs inside `app.ts` (not `index.ts`)
- `dist/` is gitignored; build before commit if deployment depends on it
- Docker: multi-stage build, `node:22-slim`, port 8081, Chromium pre-installed for Puppeteer (`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`)
