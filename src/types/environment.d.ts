declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT?: number;
      MONGO_DB_URL?: string;
      FIREBASE_SERVICE_ACCOUNT?: string;
      RBAC_ENABLE?: "true" | "false";
      GOOGLE_GENAI_API_KEY?: string;
      FTP_HOST?: string;
      FTP_BASE_PATH?: string;
      FTP_USER?: string;
      FTP_PASSWORD?: string;
      CR_EINVOICE_SERVER_URL?: string;
    }
  }
}

export {};
