import { ConnectionManager } from "../../../system/libraries/base-module/connection-manager";
import {
  catalogCacheModel,
  CatalogCacheDocument,
} from "../models/catalog-cache.model";
import {
  freightCacheModel,
  FreightCacheDocument,
} from "../models/freight-cache.model";

export class PricingSearchService {
  private connectionManager = new ConnectionManager();

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async searchCatalog(
    query: string,
    topN: number = 10,
  ): Promise<CatalogCacheDocument[]> {
    const model = this.connectionManager.bindModelToDb(catalogCacheModel);
    const escaped = this.escapeRegex(query.substring(0, 200));
    const regex = { $regex: escaped, $options: "i" };

    return model
      .find({
        active: true,
        $or: [
          { product_name: regex },
          { supplier: regex },
          { part_number: regex },
        ],
      })
      .limit(topN)
      .lean() as unknown as CatalogCacheDocument[];
  }

  async searchFreight(
    query: string,
    topN: number = 10,
  ): Promise<FreightCacheDocument[]> {
    const model = this.connectionManager.bindModelToDb(freightCacheModel);
    const escaped = this.escapeRegex(query.substring(0, 200));
    const regex = { $regex: escaped, $options: "i" };

    return model
      .find({
        active: true,
        $or: [
          { carrier: regex },
          { zone: regex },
          { origin: regex },
          { destination: regex },
          { rate_type: regex },
          { product_description: regex },
          { hs_code: regex },
        ],
      })
      .limit(topN)
      .lean() as unknown as FreightCacheDocument[];
  }

  async search(
    query: string,
    topN: number = 10,
    type?: string,
  ): Promise<(CatalogCacheDocument | FreightCacheDocument)[]> {
    if (type === "catalog" || type === "pricelist") {
      return this.searchCatalog(query, topN);
    }
    if (type === "freight" || type === "shipping") {
      return this.searchFreight(query, topN);
    }
    const [catalog, freight] = await Promise.all([
      this.searchCatalog(query, topN),
      this.searchFreight(query, topN),
    ]);
    return [...catalog, ...freight].slice(0, topN);
  }
}
