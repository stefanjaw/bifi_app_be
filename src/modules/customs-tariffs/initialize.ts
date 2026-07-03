import path from "path";
import fs from "fs";
import { customsChapterModel } from "../customs-chapters/models/customs-chapter.model";
import { customsHeadingModel } from "../customs-headings/models/customs-heading.model";
import { customsTariffModel } from "./models/customs-tariff.model";

const ASSETS_DIR = path.resolve(process.cwd(), "../attached_assets");

const CHAPTERS_FILE = path.join(
  ASSETS_DIR,
  "lhmeds_customs_db.chapters_1773769810210.json",
);
const HEADINGS_FILE = path.join(
  ASSETS_DIR,
  "lhmeds_customs_db.headings_1773769810214.json",
);
const TARIFFS_FILE = path.join(
  ASSETS_DIR,
  "lhmeds_customs_db.tariffs_1773769810212.json",
);

function readJsonFile<T>(filePath: string): T[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T[];
  } catch (err) {
    console.warn(`[customs-seed] Could not read file: ${filePath}`, err);
    return [];
  }
}

async function seedChapters(): Promise<void> {
  const raw = readJsonFile<Record<string, any>>(CHAPTERS_FILE);
  if (!raw.length) return;

  const ops = raw.map((item) => ({
    updateOne: {
      filter: { number: item.number },
      update: {
        $set: {
          number: item.number,
          description: item.description,
        },
        $setOnInsert: { active: true },
      },
      upsert: true,
    },
  }));

  const result = await customsChapterModel.bulkWrite(ops, { ordered: false });
  console.log(
    `[customs-seed] Chapters: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`,
  );
}

async function seedHeadings(): Promise<void> {
  const raw = readJsonFile<Record<string, any>>(HEADINGS_FILE);
  if (!raw.length) return;

  const ops = raw.map((item) => ({
    updateOne: {
      filter: { heading: item.heading, chapter: item.chapter },
      update: {
        $set: {
          heading: item.heading,
          chapter: item.chapter,
          description: item.description,
        },
        $setOnInsert: { active: true },
      },
      upsert: true,
    },
  }));

  const result = await customsHeadingModel.bulkWrite(ops, { ordered: false });
  console.log(
    `[customs-seed] Headings: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`,
  );
}

async function seedTariffs(): Promise<void> {
  const raw = readJsonFile<Record<string, any>>(TARIFFS_FILE);
  if (!raw.length) return;

  const BATCH_SIZE = 500;
  let totalUpserted = 0;
  let totalModified = 0;

  for (let i = 0; i < raw.length; i += BATCH_SIZE) {
    const batch = raw.slice(i, i + BATCH_SIZE);
    const ops = batch.map((item) => ({
      updateOne: {
        filter: { code: item.code },
        update: {
          $set: {
            code: item.code,
            chapter: item.chapter,
            heading: item.heading,
            subheading: item.subheading,
            description: item.description,
            unitForDuty: item.unitForDuty ?? "value",
            quantity: item.quantity ?? 1,
            unitOfMeasurement: item.unitOfMeasurement ?? "u",
            rateOfDuty: item.rateOfDuty ?? 0,
          },
          $setOnInsert: { active: true },
        },
        upsert: true,
      },
    }));

    const result = await customsTariffModel.bulkWrite(ops, { ordered: false });
    totalUpserted += result.upsertedCount;
    totalModified += result.modifiedCount;
  }

  console.log(
    `[customs-seed] Tariffs: ${totalUpserted} inserted, ${totalModified} updated`,
  );
}

/**
 * Seeds all customs reference data (chapters, headings, tariffs) into the database.
 * Safe to call on every startup — skips already-seeded data.
 */
export async function initializeCustomsData(): Promise<void> {
  try {
    console.log("[customs-seed] Starting customs reference data seeding...");
    await seedChapters();
    await seedHeadings();
    await seedTariffs();
    console.log("[customs-seed] Customs reference data seeding complete.");
  } catch (err) {
    console.error("[customs-seed] Error during customs data seeding:", err);
  }
}
