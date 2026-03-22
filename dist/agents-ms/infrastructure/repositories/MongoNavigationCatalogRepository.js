"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoNavigationCatalogRepository = void 0;
const NavigationCatalog_1 = __importDefault(require("../models/NavigationCatalog"));
class MongoNavigationCatalogRepository {
    findByVersion(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield NavigationCatalog_1.default.findOne({ version }).lean();
            if (!doc)
                return null;
            return {
                version: doc.version,
                locale: doc.locale,
                entries: doc.entries || [],
            };
        });
    }
    upsert(catalog) {
        return __awaiter(this, void 0, void 0, function* () {
            yield NavigationCatalog_1.default.updateOne({ version: catalog.version }, {
                $set: {
                    version: catalog.version,
                    locale: catalog.locale,
                    entries: catalog.entries,
                },
            }, { upsert: true });
        });
    }
}
exports.MongoNavigationCatalogRepository = MongoNavigationCatalogRepository;
//# sourceMappingURL=MongoNavigationCatalogRepository.js.map