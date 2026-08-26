import { ApiKeyDocument } from "@mongodb-types";
import { NextFunction, Request, Response } from "express";
import dayjs from "dayjs";
import { BaseController, userStorage } from "../../../system";
import { ApiKeyService, NEVER_EXPIRE_STAMP } from "../services/api-key-service";
import { CreateApiKeyDTO } from "../models/api-key.dto";

export class ApiKeyController extends BaseController<ApiKeyDocument> {
  constructor() {
    super({ service: new ApiKeyService() });
  }

  /**
   * Builds the safe-to-return representation of an API key document: strips the
   * secret fields (`hashedKey`, `salt`) and exposes a non-functional `maskedKey`
   * for the UI.
   * @param doc - The API key document to sanitize.
   * @returns A plain object with secret fields removed and `maskedKey` set.
   */
  private toSafeResponse(
    doc: ApiKeyDocument,
  ): Record<string, unknown> & { maskedKey: string } {
    const plain = doc.toObject() as Record<string, unknown>;
    delete plain["hashedKey"];
    delete plain["salt"];
    // Re-derive the stamp from the stored expiry (mirroring buildRawKey) so the
    // masked key shows when it expires, e.g. "bak_live_aB3x••••_202612312359". (6.5)
    const expiry = plain["expiresAt"] as string | Date | undefined;
    const stamp = expiry
      ? dayjs(expiry).format("YYYYMMDDHHmm")
      : NEVER_EXPIRE_STAMP;
    const maskedKey = `${plain["prefix"] as string}••••_${stamp}`;
    return { ...plain, maskedKey };
  }

  /**
   * Override create to generate the raw key once, persist only its hash, and
   * return the raw key (plus masked representation) to the client a single time.
   * @param req - The express Request with the validated CreateApiKeyDTO body.
   * @param res - The express Response.
   * @param next - The express NextFunction callback.
   */
  protected override async createHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = req.body as CreateApiKeyDTO;
      const userId = userStorage.getStore()?.user?._id.toString();
      if (!userId) throw new Error("Authenticated user not found");

      const { doc, rawKey } = await (this.service as ApiKeyService).generateKey(
        userId,
        data.name,
        data.expiresAt ? new Date(data.expiresAt) : undefined,
        data.expires,
        undefined,
      );

      const safe = this.toSafeResponse(doc);
      this.sendData(res, { ...safe, key: rawKey });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Override getById to mask sensitive fields in the response.
   * @param req - The express Request containing the id parameter.
   * @param res - The express Response.
   * @param next - The express NextFunction callback.
   */
  protected override async getByIdHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = req.params.id;
      const record = await this.service.getById(id, undefined);
      this.sendData(res, record ? this.toSafeResponse(record) : undefined);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Override get to mask sensitive fields in every returned record (single
   * array or paginated result).
   * @param req - The express Request.
   * @param res - The express Response.
   * @param next - The express NextFunction callback.
   */
  protected override async getHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const searchParams = req.query.searchParams
        ? JSON.parse(this.normalize(req.query.searchParams as string))
        : {};
      const paginationOptions = req.query.paginationOptions
        ? JSON.parse(this.normalize(req.query.paginationOptions as string))
        : undefined;
      const orderBy = req.query.orderBy
        ? JSON.parse(this.normalize(req.query.orderBy as string))
        : undefined;
      const count = req.query.count === "true" ? true : false;

      const records = await this.service.get(
        searchParams,
        paginationOptions,
        orderBy,
        count,
        undefined,
      );

      if (this.service.isPagination(records)) {
        records.docs = records.docs.map((doc) =>
          this.toSafeResponse(doc),
        ) as never;
        this.sendData(res, records);
      } else if (Array.isArray(records)) {
        this.sendData(
          res,
          records.map((doc) => this.toSafeResponse(doc)),
        );
      } else {
        this.sendData(res, records);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Express handler for renewing (rotating) a key. Mints a new raw key on the same
   * record, invalidating the old one immediately; returns the new raw key exactly
   * once (plus the masked representation). Self-scoped in the service. (5.2)
   * Kept as an arrow field (like BaseController's public handlers) so `this` stays
   * bound when Express calls it standalone as a route handler.
   */
  renew = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const userId = userStorage.getStore()?.user?._id.toString();
      if (!userId) throw new Error("Authenticated user not found");

      const { doc, rawKey } = await (this.service as ApiKeyService).renewKey(
        id,
        userId,
        undefined,
      );

      const safe = this.toSafeResponse(doc);
      this.sendData(res, { ...safe, key: rawKey });
    } catch (error) {
      next(error);
    }
  };
}
