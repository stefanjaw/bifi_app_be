import { BaseRoutes } from "../../../system";
import { AccountDocument } from "../models/account.model";
import { AccountController } from "../controllers/account-controller";
import { AccountDTO, UpdateAccountDTO } from "../models/account.dto";

const accountController = new AccountController();

export class AccountRouter extends BaseRoutes<AccountDocument> {
  constructor() {
    super({
      controller: accountController,
      endpoint: "/accounting/accounts",
      dtoCreateClass: AccountDTO,
      dtoUpdateClass: UpdateAccountDTO,
    });
  }
}
