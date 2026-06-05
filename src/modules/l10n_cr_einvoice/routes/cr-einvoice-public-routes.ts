import { Router } from "express";
import { journalEntryModel } from "../../accounting/models/journal-entry.model";

/**
 * Public, unauthenticated callback route for Hacienda.
 * MUST be mounted BEFORE the global authenticate middleware in app.ts.
 */
export class CrEinvoicePublicRouter {
  private router = Router();

  constructor() {
    this.initRoutes();
  }

  get getRouter() {
    return this.router;
  }

  private initRoutes() {
    this.router.post("/cr-einvoice/hacienda-callback", async (req, res) => {
      try {
        const { clave, indEstado } = req.body ?? {};

        if (!clave) {
          res.status(400).json({ ok: false, message: "Missing clave" });
          return;
        }

        let crEinvoiceStatus: string;
        if (indEstado === "ACEPTADO") {
          crEinvoiceStatus = "accepted";
        } else if (indEstado === "RECHAZADO") {
          crEinvoiceStatus = "rejected";
        } else {
          crEinvoiceStatus = "received";
        }

        const model = journalEntryModel;
        await model.findOneAndUpdate(
          { crClave: clave },
          { crEinvoiceStatus, crHaciendaResponse: req.body },
          { new: true }
        );

        res.status(200).json({ ok: true });
      } catch (error) {
        console.error("[CR E-Invoice] Callback error:", error);
        res.status(200).json({ ok: true });
      }
    });
  }
}
