import { UserDocument } from "@mongodb-types";

export class UserStore {
  private static intance: UserStore;

  // stored information
  private _user: UserDocument | null = null;
  private _token: string | null = null;

  public static getInstance() {
    if (!UserStore.intance) UserStore.intance = new UserStore();
    return UserStore.intance;
  }

  set user(user: UserDocument | null) {
    this._user = user;
  }

  get user() {
    return this._user;
  }

  set token(token: string | null) {
    this._token = token;
  }

  get token() {
    return this._token;
  }
}
