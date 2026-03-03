import { Request, Response } from "express";
import { PurchaseSuppliersService } from "../services/supplier-service";

const service = new PurchaseSuppliersService();

export class SupplierController {
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const searchParams = req.query.searchParams
        ? JSON.parse(req.query.searchParams as string)
        : {};
      const paginationOptions = req.query.paginationOptions
        ? JSON.parse(req.query.paginationOptions as string)
        : {};

      const result = await service.getAll(searchParams, paginationOptions);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching suppliers" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await service.getById(req.params.id);
      if (!result) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error fetching supplier" });
    }
  };
}
