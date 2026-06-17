import mongoose, { PaginateModel, Schema } from "mongoose";
import paginate from "mongoose-paginate-v2";
import autopopulate from "mongoose-autopopulate";
import { SearchDestinationDocument } from "@mongodb-types";

const searchDestinationSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    route: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "",
    },
    group: {
      type: String,
      default: "",
    },
    keywords: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    resource: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Portable standard MongoDB text index (works identically on Atlas and
// self-hosted MongoDB). NOT an Atlas $search/Lucene index.
searchDestinationSchema.index({
  label: "text",
  keywords: "text",
  group: "text",
  description: "text",
});

searchDestinationSchema.plugin(paginate);
searchDestinationSchema.plugin(autopopulate);

const searchDestinationModel = mongoose.model<
  SearchDestinationDocument,
  PaginateModel<SearchDestinationDocument>
>("SearchDestination", searchDestinationSchema);

export { searchDestinationModel };
