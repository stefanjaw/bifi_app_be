import { BaseController } from "../../../system";
import { AccountDocument } from "../models/account.model";
import { AccountService } from "../services/account-service";

const accountService = new AccountService();

export class AccountController extends BaseController<AccountDocument> {
  constructor() {
    super({ service: accountService });
  }
}
