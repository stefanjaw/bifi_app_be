import axios from "axios";
import { CrEinvoiceSettingsDocument } from "../settings/models/cr-einvoice-settings.model";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export class HaciendaAuthService {
  async getToken(settings: CrEinvoiceSettingsDocument): Promise<string> {
    if (tokenCache && Date.now() < tokenCache.expiresAt) {
      return tokenCache.token;
    }

    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("client_id", "api-prod");
    params.append("username", settings.haciendaUsername ?? "");
    params.append("password", settings.haciendaPassword ?? "");

    const response = await axios.post(
      "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const { access_token, expires_in } = response.data;
    tokenCache = {
      token: access_token,
      expiresAt: Date.now() + (expires_in - 30) * 1000,
    };

    return access_token;
  }
}

export const haciendaAuthService = new HaciendaAuthService();
