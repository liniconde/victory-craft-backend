import NavigationCatalogModel from "../models/NavigationCatalog";
import { NavigationCatalogRepository } from "../../domain/ports/NavigationCatalogRepository";
import { NavigationCatalog } from "../../domain/types";

export class MongoNavigationCatalogRepository implements NavigationCatalogRepository {
  async findByVersion(version: string): Promise<NavigationCatalog | null> {
    const doc = await NavigationCatalogModel.findOne({ version }).lean();
    if (!doc) return null;

    return {
      version: doc.version,
      locale: doc.locale,
      entries: doc.entries || [],
    };
  }

  async upsert(catalog: NavigationCatalog): Promise<void> {
    await NavigationCatalogModel.updateOne(
      { version: catalog.version },
      {
        $set: {
          version: catalog.version,
          locale: catalog.locale,
          entries: catalog.entries,
        },
      },
      { upsert: true },
    );
  }
}
