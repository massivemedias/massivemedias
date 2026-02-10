import servicesDataFr from './services';
import servicesDataEn from './services-en';

export default function getServicesData(lang) {
  return lang === 'en' ? servicesDataEn : servicesDataFr;
}
