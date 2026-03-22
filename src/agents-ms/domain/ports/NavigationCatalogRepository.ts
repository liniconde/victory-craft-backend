import { NavigationCatalog } from "../types";

export interface NavigationCatalogRepository {
  findByVersion(version: string): Promise<NavigationCatalog | null>;
  upsert(catalog: NavigationCatalog): Promise<void>;
}
