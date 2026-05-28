// Constantes centralisees pour l'avis "atelier sur rendez-vous uniquement".
// Utilise par WorkshopAppointmentBar (bandeau global) et injecte dans les
// meta descriptions, FAQ, Schema.org JSON-LD, tunnel d'achat et emails.
// SSOT - ne PAS dupliquer ces strings ailleurs dans le codebase.

export const WORKSHOP_NOTICE = {
  fr: 'Atelier sur rendez-vous uniquement, aucune visite spontanee',
  en: 'Workshop by appointment only, no walk-ins',
  es: 'Taller solo con cita previa, sin visitas sin cita',
};

export const WORKSHOP_NOTICE_SHORT = {
  fr: 'sur RDV',
  en: 'by appt',
  es: 'con cita',
};

export const WORKSHOP_ADDRESS_FULL = {
  fr: 'Atelier sur rendez-vous uniquement, 5338 rue Marquette, Plateau Mont-Royal, Montreal',
  en: 'Workshop by appointment only, 5338 rue Marquette, Plateau Mont-Royal, Montreal',
  es: 'Taller solo con cita previa, 5338 rue Marquette, Plateau Mont-Royal, Montreal',
};
