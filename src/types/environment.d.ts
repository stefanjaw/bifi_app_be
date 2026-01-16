declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT?: number;
      MONGO_DB_URL?: string;
      FIREBASE_SERVICE_ACCOUNT?: string;
      BUG_REPORTING_URL?: string;
      BUG_REPORTING_PROJECT_ID?: string;
      BUG_REPORTING_PASSWORD?: string;
      RBAC_ENABLE?: "true" | "false";
      GOOGLE_GENAI_API_KEY?: string;
      FTP_HOST?: string;
      FTP_BASE_PATH?: string;
      FTP_USER?: string;
      FTP_PASSWORD?: string;
    }
  }
}

export {};
