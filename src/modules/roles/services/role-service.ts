import { PolicyDocument, RoleDocument } from "@mongodb-types";
import { BaseService, ValidationException } from "../../../system";
import { roleModel } from "../models/role.model";
import { ClientSession } from "mongoose";
import { RoleDTO } from "../models/role.dto";

export class RoleService extends BaseService<RoleDocument> {
  constructor() {
    super({
      model: roleModel,
      refFields: [
        {
          path: "policies",
          getModel: () =>
            this.connectionManager.getModel<PolicyDocument>("Policy"),
          isArray: true,
        },
      ],
    });
  }

  /**
   * Creates a new role document.
   * Throws an error if a role with the same name already exists.
   * @param data - The role data to create.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the created role document.
   */
  override async create(
    data: RoleDTO,
    session?: ClientSession | undefined
  ): Promise<RoleDocument> {
    const roleWithSameName = await this.connectionManager
      .bindModelToDb(this.model)
      .findOne({ name: data.name, active: true });

    if (roleWithSameName) {
      throw new ValidationException("Role with the same name already exists");
    }

    return await super.create(data, session);
  }
}
