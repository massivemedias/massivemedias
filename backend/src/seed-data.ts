// Seed data - chargement depuis JSON pour reduire la memoire TS compilation
// Les donnees brutes sont dans seed-data.json (pas compilees par TypeScript)
import seedJson from './seed-data.json';

const siteContentSeedData = seedJson.siteContentSeedData;
const servicePagesSeedData = seedJson.servicePagesSeedData;
const artistsSeedData = seedJson.artistsSeedData;
const productsSeedData = seedJson.productsSeedData;

export { siteContentSeedData, servicePagesSeedData, artistsSeedData, productsSeedData };
