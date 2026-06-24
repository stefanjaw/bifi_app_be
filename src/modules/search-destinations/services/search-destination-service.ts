import { ClientSession } from "mongoose";
import { BaseService } from "../../../system";
import { SearchDestinationDocument } from "@mongodb-types";
import { searchDestinationModel } from "../models/search-destination.model";
import {
  MongoTextSearchProvider,
  SearchProvider,
  SearchResult,
} from "./search-provider";
import { DEFAULT_SEARCH_DESTINATIONS } from "./default-destinations";

export class SearchDestinationService extends BaseService<SearchDestinationDocument> {
  private readonly provider: SearchProvider;

  constructor() {
    super({
      model: searchDestinationModel,
    });

    // Portable provider only. See search-provider.ts for the portability
    // constraint (no Atlas $search). Swapping engines = new implementation.
    this.provider = new MongoTextSearchProvider(async (filter) => {
      const model = this.connectionManager.bindModelToDb(searchDestinationModel);
      return (await model
        .find(filter)
        .lean()) as unknown as SearchDestinationDocument[];
    });
  }

  /**
   * Returns the full list of active destinations for the frontend to cache
   * and fuzzy-match in memory.
   */
  async getAllActive(): Promise<SearchDestinationDocument[]> {
    const model = this.connectionManager.bindModelToDb(searchDestinationModel);
    return (await model
      .find({ active: true })
      .sort({ group: 1, label: 1 })
      .lean()) as unknown as SearchDestinationDocument[];
  }

  /**
   * Portable ranked search over destinations.
   */
  async search(query: string, limit?: number): Promise<SearchResult[]> {
    return this.provider.search(query, limit);
  }

  /**
   * Reconcile a provided list of live destinations (from the frontend
   * menu/routing managers) into the collection:
   * - insert new destinations
   * - update label/route/icon/group/description/resource for existing rows
   * - NEVER overwrite user-edited `keywords` (only fills keywords when the
   *   row has none yet)
   * - mark system destinations that are no longer present as inactive
   *
   * User-created rows (`isSystem: false`) are never deactivated by sync.
   */
  async syncDestinations(
    destinations: Array<Record<string, any>>,
    session?: ClientSession
  ): Promise<{ inserted: number; updated: number; deactivated: number }> {
    const model = this.connectionManager.bindModelToDb(searchDestinationModel);

    let inserted = 0;
    let updated = 0;

    const incomingKeys = new Set<string>();

    for (const dest of destinations || []) {
      if (!dest || !dest.key) continue;
      incomingKeys.add(dest.key);

      const existing = await model.findOne({ key: dest.key }).session(
        session ?? null
      );

      if (!existing) {
        await model.create(
          [
            {
              key: dest.key,
              label: dest.label,
              route: dest.route,
              icon: dest.icon ?? "",
              group: dest.group ?? "",
              keywords: Array.isArray(dest.keywords) ? dest.keywords : [],
              description: dest.description ?? "",
              resource: dest.resource ?? "",
              active: true,
              isSystem: true,
            },
          ],
          { session: session ?? undefined }
        );
        inserted++;
        continue;
      }

      // Never touch user-created rows (isSystem: false), even on a key
      // collision — sync only manages system destinations.
      if (existing.isSystem === false) {
        continue;
      }

      // Update presentational/navigational fields but preserve user keywords.
      existing.label = dest.label ?? existing.label;
      existing.route = dest.route ?? existing.route;
      existing.icon = dest.icon ?? existing.icon;
      existing.group = dest.group ?? existing.group;
      existing.description = dest.description ?? existing.description;
      existing.resource = dest.resource ?? existing.resource;
      existing.active = true;

      // Only seed keywords if the row has none yet — never clobber user edits.
      if (
        (!existing.keywords || existing.keywords.length === 0) &&
        Array.isArray(dest.keywords) &&
        dest.keywords.length > 0
      ) {
        existing.keywords = dest.keywords as any;
      }

      await existing.save({ session: session ?? undefined });
      updated++;
    }

    // Deactivate system destinations that are no longer reported by the
    // frontend. User-created rows (isSystem: false) are left untouched.
    const deactivateResult = await model.updateMany(
      {
        isSystem: true,
        active: true,
        key: { $nin: Array.from(incomingKeys) },
      },
      { active: false },
      { session: session ?? undefined }
    );

    return {
      inserted,
      updated,
      deactivated: deactivateResult.modifiedCount ?? 0,
    };
  }
}

/**
 * Idempotent seed of the curated default destinations. Only runs when the
 * collection is empty so it never clobbers a populated/edited collection.
 */
export async function seedSearchDestinations(): Promise<void> {
  const count = await searchDestinationModel.countDocuments();
  if (count > 0) return;

  await searchDestinationModel.create(
    DEFAULT_SEARCH_DESTINATIONS.map((d) => ({
      ...d,
      icon: d.icon ?? "",
      group: d.group ?? "",
      keywords: d.keywords ?? [],
      description: d.description ?? "",
      resource: d.resource ?? "",
      active: true,
      isSystem: true,
    }))
  );

  console.log(
    `Seeded ${DEFAULT_SEARCH_DESTINATIONS.length} default search destinations.`
  );
}
