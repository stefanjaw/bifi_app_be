import {
  BaseService,
  orderByQuery,
  runTransaction,
  ValidationException,
} from "../../../system";
import {
  getChromiumExecutablePath,
  getLaunchArgs,
} from "../../../system/libraries/pdf";
import { ClientSession } from "mongoose";
import type mongoose from "mongoose";
import puppeteer from "puppeteer";
import dayjs from "dayjs";
import { reportingModel } from "../models/reporting.model";
import Handlebars from "handlebars";
import sanitizeHtml from "sanitize-html";
import { ReportingDocument } from "@mongodb-types";
import { ReportingDTO, UpdateReportingDTO } from "../models/reporting.dto";

export class ReportingService extends BaseService<ReportingDocument> {
  constructor() {
    super({ model: reportingModel });

    // helper for getting data values
    Handlebars.registerHelper("getValue", function (obj, rawPath) {
      if (!rawPath || !obj) return undefined;

      // Step 1: separar segmentos por ".", pero sin perder "[]" o "[0]"
      const segments = rawPath.split(".");

      function resolveSegment(value: any, segment: string): any {
        if (value === undefined || value === null) return undefined;

        // Caso: array sin índice → "items[]"
        if (segment.endsWith("[]")) {
          const key = segment.slice(0, -2);
          const arrayValue = value[key];
          if (!Array.isArray(arrayValue)) return undefined;
          return arrayValue; // devolvemos el array completo (lo procesamos luego)
        }

        // Caso: array con índice → "items[3]"
        const arrayIndexMatch = segment.match(/^(.*)\[(\d+)\]$/);
        if (arrayIndexMatch) {
          const key = arrayIndexMatch[1];
          const index = Number(arrayIndexMatch[2]);

          const arrayValue = value[key];
          if (!Array.isArray(arrayValue)) return undefined;

          return arrayValue[index];
        }

        // Caso normal → "field"
        return value[segment];
      }

      let current: any = obj;

      for (const segment of segments) {
        if (Array.isArray(current)) {
          // Si el current es un array, aplicamos el resolver a cada item
          current = current.map((item) => resolveSegment(item, segment));
        } else {
          current = resolveSegment(current, segment);
        }

        // Flatten arrays anidados
        if (Array.isArray(current)) {
          current = current.flat(Infinity);
        }
      }

      // === Normalización final ===
      if (Array.isArray(current)) {
        // Convertir array en "Ana, Luis"
        return current
          .filter((x) => x !== undefined && x !== null)
          .map((x) => String(x))
          .join(", ");
      }

      return current;
    });

    // helper for getting current date
    Handlebars.registerHelper("now", function () {
      return dayjs().format("DD MMM YYYY (hh:mm a)");
    });

    Handlebars.registerHelper("getISODate", function (item, rawPath) {
      const date = Handlebars.helpers.getValue(item, rawPath);
      return date ? dayjs(date).toISOString().split("T")[0] : "NO DATE";
    });
  }

  /**
   * Generate a PDF report based on the template, model and search parameters provided.
   *
   * If reportId is sent, the template will be fetched from the database. If modelName is sent, the first template with the matching model will be used.
   *
   * If searchParams is sent, the data will be fetched from the database based on the search parameters provided.
   *
   * If orderBy is sent, the data will be sorted based on the order by query provided.
   *
   * If session is sent, the operation will be run in a transaction with the provided session.
   *
   * @param {string | undefined} modelName - Name of the model to fetch the template from.
   * @param {string | undefined} reportId - Id of the template to fetch from the database.
   * @param {Record<string, any> | undefined} searchParams - Search parameters to fetch the data from the database.
   * @param {orderByQuery["orderBy"] | undefined} orderBy - Order by query to sort the data.
   * @param {ClientSession | undefined} session - Session to run the operation in a transaction with.
   * @returns {Promise<Uint8Array<ArrayBufferLike>>} A promise that resolves with the generated PDF report buffer.
   */
  async generatePDFReport(
    modelName: string | undefined,
    reportId: string | undefined,
    searchParams: Record<string, any> | undefined,
    orderBy: orderByQuery["orderBy"] | undefined,
    session?: ClientSession | undefined,
  ) {
    return await runTransaction<Uint8Array<ArrayBufferLike>>(
      session,
      async (newSession) => {
        // get template based on model or id, if model is sent
        const reportingTemplate = reportId
          ? await this.getById(reportId, newSession)
          : modelName
            ? (
                await this.get(
                  { model: modelName },
                  undefined,
                  undefined,
                  undefined,
                  newSession,
                )
              )[0]
            : undefined;

        if (!reportingTemplate)
          throw new ValidationException(
            "No reporting template matches the configuration sent",
          );

        // check that model is valid and get model
        const isValidModel = !!this.connectionManager
          .getModeList()
          .includes(reportingTemplate.model);

        if (!isValidModel)
          throw new ValidationException("Template's model is not valid");

        // finding data
        const model = this.connectionManager.getModel<mongoose.Document>(
          reportingTemplate.model,
        );

        // if orderBy sent by user, build the object
        let orderByObject: Record<string, any> | undefined = {};

        if (orderBy && orderBy.length > 0) {
          orderBy.forEach((item) => {
            orderByObject[item.field] = item.order === "asc" ? 1 : -1;
          });
        }

        const data = (
          await model
            .find(searchParams || { active: true })
            .sort(orderByObject)
            .session(newSession)
        ).map((doc) => doc.toObject());

        // generate html — sanitize to block triple-stache unescaped output
        // and script injection from user-authored templates (M5)
        const template = Handlebars.compile(reportingTemplate.template);
        const html = sanitizeHtml(template({ items: data }), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat([
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "style",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
          ]),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            "*": ["style", "class", "id"],
          },
        });

        // generate pdf buffer
        // Timeout prevents a malicious template that never settles from
        // holding a Chrome process open (C8). browser.close() is in a finally
        // block so the process is always released, even on throw.
        const PDF_TIMEOUT_MS = 30_000;
        let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

        try {
          browser = await puppeteer.launch({
            executablePath: await getChromiumExecutablePath(),
            args: getLaunchArgs(),
            headless: true,
          });

          const page = await browser.newPage();
          await page.setContent(html, {
            waitUntil: "domcontentloaded",
            timeout: PDF_TIMEOUT_MS,
          });

          const pdfBuffer = await page.pdf({
            format: "TABLOID",
            printBackground: true,
            timeout: PDF_TIMEOUT_MS,
            margin: {
              top: "20px",
              bottom: "20px",
              left: "20px",
              right: "20px",
            },
          });

          return pdfBuffer;
        } finally {
          if (browser) {
            try {
              await browser.close();
            } catch {
              // best-effort close — the process may already be dead
            }
          }
        }
      },
    );
  }

  override async create(
    data: ReportingDTO,
    session?: ClientSession | undefined,
  ): Promise<ReportingDocument> {
    return await runTransaction<ReportingDocument>(
      session,
      async (newSession) => {
        if (!this.connectionManager.getModeList().includes(data.model))
          throw new ValidationException(
            "Model is not valid and included in models list",
          );

        return await super.create(data, newSession);
      },
    );
  }

  override async update(
    data: UpdateReportingDTO,
    session?: ClientSession | undefined,
  ): Promise<ReportingDocument> {
    return await runTransaction<ReportingDocument>(
      session,
      async (newSession) => {
        if (
          data.model &&
          !this.connectionManager.getModeList().includes(data.model)
        )
          throw new ValidationException(
            "Model is not valid and included in models list",
          );

        return await super.update(data, newSession);
      },
    );
  }
}
