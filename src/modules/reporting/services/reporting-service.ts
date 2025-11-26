import mongoose, { model } from "mongoose";
import { runTransaction, ValidationException } from "../../../system";
import { ClientSession } from "mongoose";
import puppeteer from "puppeteer";
import dayjs from "dayjs";
import { reportingMap } from "../libraries/reporting-map";
import { IReportingPaths } from "../interfaces/reporting";

export class ReportingService {
  private getValueByPath(obj: any, rawPath: string): any {
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
  }

  private generateHTMLTemplate(
    title: string,
    columnNames: IReportingPaths,
    data: Record<string, any>[]
  ) {
    return `
    <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 40px;
                background: #f9f9f9;
                color: #333;
            }

            .container {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
            }

            .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
            .invoice-info h1 { margin: 0; color: #1f2937; }
            .invoice-meta { text-align: right; }

            /* --- FIX CRÍTICO PARA PDF --- */
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
                table-layout: fixed; /* <--- EVITA DESBORDES */
                word-wrap: break-word; /* <--- CORTA TEXTO LARGO */
                overflow-wrap: break-word;
            }

            thead th {
                background: #f8fafc;
                text-align: left;
                padding: 12px;
                border-bottom: 2px solid #e2e8f0;
                font-size: 14px;
            }

            tbody td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 13px;
                vertical-align: top; /* <--- EVITA EXPANSIONES RARAS */
            }

            .text-right { text-align: right; }

            /* --- EVITA QUE UNA FILA CORTADA SALTE A OTRA PÁGINA --- */
            tr {
                page-break-inside: avoid;
            }

            /* --- PREVENCIÓN FINAL PARA DESBORDE DE TODO EL CONTENIDO --- */
            * {
                box-sizing: border-box;
            }
        </style>
        </head>
        <body>
        <div class="container">
            <div class="header">
            <div class="logo">BASE APP</div>
            <div class="invoice-meta">
                <h1>REPORTING</h1>
                <p><strong>Model:</strong> ${title}</p>
                <p><strong>Date:</strong> ${dayjs().format("DD MMM YYYY (hh:mm A)")}</p>
            </div>
            </div>

            <table>
            <thead>
                <tr>
                ${columnNames
                  .map((col, i) =>
                    i === 0
                      ? `<th><strong>${col.label}</strong></th>`
                      : `<th class="text-right">${col.label}</th>`
                  )
                  .join("")}
                </tr>
            </thead>
            <tbody>
               ${data
                 .map(
                   (row) => `<tr>
                    ${columnNames
                      .map((col, i) =>
                        i === 0
                          ? `<td><strong>${this.getValueByPath(
                              row,
                              col.path
                            )}</strong></td>`
                          : `<td class="text-right">${this.getValueByPath(
                              row,
                              col.path
                            )}</td>`
                      )
                      .join("")}
                </tr>`
                 )
                 .join("")}
            </tbody>
            </table>
        </div>
        </body>
        </html>
    `;
  }

  async generatePDFReport(
    modelName: string,
    session?: ClientSession | undefined
  ) {
    return await runTransaction<Uint8Array<ArrayBufferLike>>(
      session,
      async (newSession) => {
        // check that model is valid and get model
        const isValidModel = !!mongoose.modelNames().includes(modelName);

        if (!isValidModel)
          throw new ValidationException("ModelName is not valid");

        const model = mongoose.model<Document>(modelName);

        // get data but only active data
        const title = modelName.replace(/([A-Z])/g, " $1");

        const columns = reportingMap[modelName] || [];

        const data = (
          await model.find({ active: true }).session(newSession)
        ).map((doc) => doc.toObject());

        // generate html
        const html = this.generateHTMLTemplate(title, columns, data);

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
