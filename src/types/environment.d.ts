declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT?: number;
      CORS_ORIGINS?: string;
      MONGO_DB_URL?: string;
      FIREBASE_SERVICE_ACCOUNT?: string;
      RBAC_ENABLE?: "true" | "false";
      GOOGLE_GENAI_API_KEY?: string;
      FTP_HOST?: string;
      FTP_BASE_PATH?: string;
      FTP_USER?: string;
      FTP_PASSWORD?: string;
      CR_EINVOICE_SERVER_URL?: string;
      EMAIL_TOKEN_SECRET?: string;
      EMAIL_WEBHOOK_SECRET?: string;
      TENANT_DB_NAMES?: string;
      AUTO_PROVISION_EMAIL_DOMAINS?: string;
      API_KEY_HASH_PEPPER?: string;
    }
  }
}

export {};
