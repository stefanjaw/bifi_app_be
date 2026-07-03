import { SearchDestinationDocument } from "@mongodb-types";

/**
 * A single ranked search result: the matched destination plus a numeric
 * relevance score (higher = more relevant).
 */
export interface SearchResult {
  destination: SearchDestinationDocument;
  score: number;
}

/**
 * Engine-agnostic search contract. The ONLY place engine-specific matching
 * logic should live. Swapping the matching engine (e.g. adding an
 * AtlasSearchProvider) means adding a new implementation here — callers
 * (controllers/services) never change.
 */
export interface SearchProvider {
  search(query: string, limit?: number): Promise<SearchResult[]>;
}

/**
 * Default, fully PORTABLE search provider.
 *
 * IMPORTANT — portability constraint:
 * This implementation uses ONLY standard MongoDB operators (`$regex` plus an
 * in-memory relevance score). It deliberately does NOT use MongoDB Atlas
 * Search (`$search` / Lucene), which is Atlas-only and would not run on a
 * self-hosted MongoDB. Because the searched set (navigable destinations) is
 * small and bounded (~100-200 rows), regex matching + in-code ranking is
 * fast, deterministic, and behaves identically on Atlas and self-hosted
 * MongoDB. A standard `$text` index also exists on the collection and can be
 * used here if ever desired; regex is used as the primary strategy so search
 * never depends on a per-database index having been built.
 *
 * If heavy full-text search over large business-record collections is ever
 * required, add a separate AtlasSearchProvider implementing SearchProvider and
 * select it via config — do not change this portable default.
 */
export class MongoTextSearchProvider implements SearchProvider {
  constructor(
    private readonly findActive: (
      filter: Record<string, any>,
    ) => Promise<SearchDestinationDocument[]>,
  ) {}

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const trimmed = (query || "").trim();
    if (!trimmed) return [];

    const escaped = this.escapeRegExp(trimmed);
    const regex = new RegExp(escaped, "i");

    // Standard, portable $regex query across the searchable string fields.
    const candidates = await this.findActive({
      active: true,
      $or: [
        { label: regex },
        { keywords: regex },
        { group: regex },
        { description: regex },
        { key: regex },
      ],
    });

    const scored = candidates
      .map((destination) => ({
        destination,
        score: this.scoreDestination(destination, trimmed.toLowerCase()),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.destination.label || "").localeCompare(
          b.destination.label || "",
        );
      });

    return scored.slice(0, limit);
  }

  /**
   * Deterministic relevance scoring (higher = better):
   * - exact label match: 100
   * - exact keyword match: 90
   * - label starts-with: 60
   * - keyword starts-with: 50
   * - label contains: 30
   * - keyword contains: 20
   * - group contains: 10
   * - description contains: 5
   */
  private scoreDestination(
    destination: SearchDestinationDocument,
    q: string,
  ): number {
    const label = (destination.label || "").toLowerCase();
    const group = (destination.group || "").toLowerCase();
    const description = (destination.description || "").toLowerCase();
    const keywords = (destination.keywords || []).map((k) =>
      (k || "").toLowerCase(),
    );

    let score = 0;

    if (label === q) score += 100;
    else if (label.startsWith(q)) score += 60;
    else if (label.includes(q)) score += 30;

    if (keywords.includes(q)) score += 90;
    else if (keywords.some((k) => k.startsWith(q))) score += 50;
    else if (keywords.some((k) => k.includes(q))) score += 20;

    if (group.includes(q)) score += 10;
    if (description.includes(q)) score += 5;

    return score;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
