"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsSeedData = exports.artistsSeedData = exports.servicePagesSeedData = exports.siteContentSeedData = void 0;
// Seed data - chargement depuis JSON pour reduire la memoire TS compilation
// Les donnees brutes sont dans seed-data.json (pas compilees par TypeScript)
const seed_data_json_1 = __importDefault(require("./seed-data.json"));
const siteContentSeedData = seed_data_json_1.default.siteContentSeedData;
exports.siteContentSeedData = siteContentSeedData;
const servicePagesSeedData = seed_data_json_1.default.servicePagesSeedData;
exports.servicePagesSeedData = servicePagesSeedData;
const artistsSeedData = seed_data_json_1.default.artistsSeedData;
exports.artistsSeedData = artistsSeedData;
const productsSeedData = seed_data_json_1.default.productsSeedData;
exports.productsSeedData = productsSeedData;
