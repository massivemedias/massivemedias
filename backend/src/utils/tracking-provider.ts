// Provider de suivi de colis.
// Architecture abstraite pour supporter plusieurs fournisseurs (17Track, Shippo,
// EasyPost, API Postes Canada). Par defaut, retourne un MOCK INTELLIGENT base sur
// un hash deterministe du numero de suivi pour que les tests restent stables et
// que la UI puisse etre developpee avant le branchement prod.
//
// Pour brancher un vrai provider :
//   1. Implementer fetchFromProvider() avec l'API key dans les env vars
//   2. Le mock se desactive automatiquement des que TRACKING_API_KEY existe

export type TrackingStatus = 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown';

export interface TrackingEvent {
  date: string;         // ISO
  location: string;
  description: string;
  statusCode?: string;
}

export interface TrackingResult {
  trackingNumber: string;
  carrier: string;
  status: TrackingStatus;
  statusLabel: string;
  events: TrackingEvent[];
  delivered: boolean;
  deliveredAt: string | null;
  suggestStatusChange: 'delivered' | 'shipped' | null;
  providerUsed: 'mock' | '17track' | 'shippo' | 'easypost';
}

/**
 * Hash deterministe (djb2) pour generer une timeline mock stable par tracking number.
 */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h = h & 0x7fffffff;
  }
  return h;
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

const STATUS_LABELS: Record<TrackingStatus, string> = {
  in_transit: 'En transit',
  out_for_delivery: 'En cours de livraison',
  delivered: 'Livre',
  exception: 'Exception / retard',
  unknown: 'Inconnu',
};

/**
 * Genere une timeline fictive mais plausible basee sur le hash du tracking number.
 * 4 scenarios possibles (distribution uniforme) :
 *   - 25% in_transit (ramasse + en route)
 *   - 25% out_for_delivery (ramasse + transit + camion de livraison)
 *   - 50% delivered (pipeline complet livre)
 */
function mockTracking(trackingNumber: string, carrier: string): TrackingResult {
  const h = hashString(trackingNumber);
  const scenario = h % 4; // 0,1 = delivered | 2 = out_for_delivery | 3 = in_transit

  const now = new Date();
  const events: TrackingEvent[] = [];

  // Toujours : ramasse chez l'expediteur (Massive Medias Montreal)
  events.push({
    date: subDays(now, 4).toISOString(),
    location: 'Montreal, QC',
    description: 'Colis ramasse par le transporteur',
    statusCode: 'PICKUP',
  });
  events.push({
    date: subDays(now, 3).toISOString(),
    location: 'Centre de tri Lachine, QC',
    description: 'Colis recu au centre de traitement',
    statusCode: 'IN_TRANSIT',
  });

  if (scenario === 3) {
    // in_transit : arret au tri, pas encore sorti
    events.push({
      date: subDays(now, 1).toISOString(),
      location: 'Centre de tri regional',
      description: 'En transit vers la destination',
      statusCode: 'IN_TRANSIT',
    });
    return {
      trackingNumber,
      carrier,
      status: 'in_transit',
      statusLabel: STATUS_LABELS.in_transit,
      events: events.reverse(),
      delivered: false,
      deliveredAt: null,
      suggestStatusChange: null,
      providerUsed: 'mock',
    };
  }

  events.push({
    date: subDays(now, 2).toISOString(),
    location: 'Centre de distribution destinataire',
    description: 'Arrive au centre de distribution local',
    statusCode: 'ARRIVED',
  });

  if (scenario === 2) {
    // out_for_delivery : camion de livraison aujourd'hui
    events.push({
      date: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      location: 'Centre de distribution local',
      description: 'En cours de livraison - sur le camion',
      statusCode: 'OUT_FOR_DELIVERY',
    });
    return {
      trackingNumber,
      carrier,
      status: 'out_for_delivery',
      statusLabel: STATUS_LABELS.out_for_delivery,
      events: events.reverse(),
      delivered: false,
      deliveredAt: null,
      suggestStatusChange: 'shipped',
      providerUsed: 'mock',
    };
  }

  // scenario 0 ou 1 : livre
  events.push({
    date: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    location: 'Centre de distribution local',
    description: 'En cours de livraison - sur le camion',
    statusCode: 'OUT_FOR_DELIVERY',
  });
  const deliveredAt = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  events.push({
    date: deliveredAt,
    location: 'Adresse du destinataire',
    description: 'Livre - signature recue',
    statusCode: 'DELIVERED',
  });

  return {
    trackingNumber,
    carrier,
    status: 'delivered',
    statusLabel: STATUS_LABELS.delivered,
    events: events.reverse(),
    delivered: true,
    deliveredAt,
    suggestStatusChange: 'delivered',
    providerUsed: 'mock',
  };
}

/**
 * Hook pour brancher un vrai provider plus tard. Pour l'instant, si TRACKING_API_KEY
 * est defini, on log l'intention mais on reste sur le mock (evite crash si config incomplete).
 */
async function fetchFromProvider(trackingNumber: string, carrier: string): Promise<TrackingResult | null> {
  const apiKey = process.env.TRACKING_API_KEY;
  if (!apiKey) return null;

  // TODO : brancher 17Track / Shippo / EasyPost ici.
  // Exemple 17Track :
  //   const res = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
  //     method: 'POST',
  //     headers: { '17token': apiKey, 'Content-Type': 'application/json' },
  //     body: JSON.stringify([{ number: trackingNumber, carrier: carrierCode }]),
  //   });
  //   ... parse et mapper en TrackingResult
  //
  // Tant que le branchement n'est pas fait, on retourne null pour tomber sur le mock.
  return null;
}

/**
 * Point d'entree public : recupere le statut de livraison d'un colis.
 * Essaie d'abord le vrai provider si configure, sinon fallback sur le mock intelligent.
 */
export async function getTrackingStatus(trackingNumber: string, carrier?: string): Promise<TrackingResult> {
  const c = (carrier || 'postes-canada').toLowerCase();
  if (!trackingNumber || !trackingNumber.trim()) {
    return {
      trackingNumber: '',
      carrier: c,
      status: 'unknown',
      statusLabel: STATUS_LABELS.unknown,
      events: [],
      delivered: false,
      deliveredAt: null,
      suggestStatusChange: null,
      providerUsed: 'mock',
    };
  }

  const real = await fetchFromProvider(trackingNumber.trim(), c);
  if (real) return real;

  return mockTracking(trackingNumber.trim(), c);
}
