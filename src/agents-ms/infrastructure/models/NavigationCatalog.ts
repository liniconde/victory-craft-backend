import mongoose, { Schema } from "mongoose";

const NavigationCatalogEntrySchema = new Schema(
  {
    route: { type: String, required: true },
    actionName: { type: String, required: true, default: "navigation.go_to" },
    title: { type: String, required: true },
    section: { type: String, required: false },
    page: { type: String, required: false },
    subpage: { type: String, required: false },
    aliases: { type: [String], default: [] },
    breadcrumbs: { type: [String], default: [] },
    parents: { type: [String], default: [] },
    intentTags: { type: [String], default: [] },
    isLanding: { type: Boolean, default: false },
    popularity: { type: Number, default: 0 },
  },
  { _id: false },
);

const NavigationCatalogSchema = new Schema(
  {
    version: { type: String, required: true, unique: true, index: true },
    locale: { type: String, required: false },
    entries: { type: [NavigationCatalogEntrySchema], required: true, default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("AgentNavigationCatalog", NavigationCatalogSchema, "agent_navigation_catalogs");
