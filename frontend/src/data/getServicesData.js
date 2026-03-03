import servicesDataFr from './services';
import servicesDataEn from './services-en';
import servicesDataEs from './services-es';

const servicesMap = { fr: servicesDataFr, en: servicesDataEn, es: servicesDataEs };

export default function getServicesData(lang) {
  return servicesMap[lang] || servicesDataFr;
}
