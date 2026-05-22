import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";

export type UserShortcutsDocument = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  shortcuts?: Array<{
    _id?: string;
    label?: string;
    icon?: string;
    routerLink?: string[];
    resource?: string;
  }>;
};

const shortcutItemSchema = new Schema(
  {
    label: { type: String, required: false },
    icon: { type: String, required: false },
    routerLink: { type: [String], required: false, default: [] },
    resource: { type: String, required: false },
  },
  { _id: false }
);

const userShortcutsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    shortcuts: {
      type: [shortcutItemSchema],
      required: false,
      default: [],
    },
  },
  {
    collection: "usershortcuts",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
  }
);

userShortcutsSchema.plugin(paginate);
userShortcutsSchema.plugin(autopopulate);

const userShortcutsModel = mongoose.model<
  UserShortcutsDocument,
  PaginateModel<UserShortcutsDocument>
>("UserShortcuts", userShortcutsSchema);

export { userShortcutsModel };
