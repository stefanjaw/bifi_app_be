import mongoose, { model } from "mongoose";
import {
  BaseService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { ClientSession } from "mongoose";
import puppeteer from "puppeteer";
import dayjs from "dayjs";
import { reportingModel } from "../models/reporting.model";
import Handlebars from "handlebars";
import { ReportingDocument } from "@mongodb-types";

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
  }

  async generatePDFReport(
    modelName?: string,
    reportId?: string,
    session?: ClientSession | undefined
  ) {
    return await runTransaction<Uint8Array<ArrayBufferLike>>(
      session,
      async (newSession) => {
        // get template based on model or id, if model is sent
        const reportingTemplate = reportId
          ? await reportingModel.findById(reportId).session(newSession)
          : modelName
          ? (
              await reportingModel
                .find({ model: modelName })
                .session(newSession)
            )[0]
          : undefined;

        if (!reportingTemplate)
          throw new ValidationException(
            "No reporting template matches the configuration sent"
          );

        // check that model is valid and get model
        const isValidModel = !!mongoose
          .modelNames()
          .includes(reportingTemplate.model);

        if (!isValidModel)
          throw new ValidationException("Template's model is not valid");

        // finding data
        const model = mongoose.model<Document>(reportingTemplate.model);

        const data = (
          await model.find({ active: true }).session(newSession)
        ).map((doc) => doc.toObject());

        // generate html
        const template = Handlebars.compile(reportingTemplate.template);
        const html = template({ items: data });

        // generate pdf buffer
        const browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "domcontentloaded" });

        const pdfBuffer = await page.pdf({
          format: "TABLOID",
          printBackground: true,
          margin: {
            top: "20px",
            bottom: "20px",
            left: "20px",
            right: "20px",
          },
        });

        await browser.close();

        return pdfBuffer;
      }
    );
  }
}
