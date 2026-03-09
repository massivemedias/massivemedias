import { useEffect, useRef, useState } from 'react';

// Read API key at runtime (not build time) to avoid Vite tree-shaking
function getApiKey() {
  return import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
}

// Load Google Maps + Places library once
let loadPromise = null;
function loadGoogleMaps() {
  if (window.google?.maps?.places?.PlaceAutocompleteElement) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const key = getApiKey();
  if (!key) return Promise.reject(new Error('No Google Places API key configured'));

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places&language=fr';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

// Parse Place (new API) into structured address
function parsePlace(place) {
  const result = { address: '', city: '', province: '', postalCode: '', country: '' };
  if (!place.addressComponents) return result;

  let streetNumber = '';
  let route = '';

  for (const c of place.addressComponents) {
    if (c.types.includes('street_number')) streetNumber = c.longText;
    if (c.types.includes('route')) route = c.longText;
    if (c.types.includes('locality') || c.types.includes('sublocality_level_1')) result.city = c.longText;
    if (c.types.includes('administrative_area_level_1')) result.province = c.shortText;
    if (c.types.includes('postal_code')) result.postalCode = c.longText;
    if (c.types.includes('country')) result.country = c.longText;
  }

  result.address = [streetNumber, route].filter(Boolean).join(' ');
  return result;
}

/**
 * AddressAutocomplete - Champ adresse avec Google Places suggestions
 * Utilise PlaceAutocompleteElement (nouvelle API, remplace Autocomplete deprecated)
 *
 * Props:
 * - value: string (valeur initiale / pre-remplissage)
 * - onChange: (address: string) => void
 * - onPlaceSelect: ({ address, city, province, postalCode, country }) => void
 * - className, placeholder, id, required
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  className = 'input-field',
  placeholder = '',
  id,
  required,
}) {
  const containerRef = useRef(null);
  const pacRef = useRef(null);
  const initialValue = useRef(value);
  const [ready, setReady] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Load Google Maps
  useEffect(() => {
    let mounted = true;
    loadGoogleMaps()
      .then(() => { if (mounted) setReady(true); })
      .catch((err) => {
        console.warn('Google Maps:', err.message);
        if (mounted) setApiError(true);
      });
    return () => { mounted = false; };
  }, []);

  // Create PlaceAutocompleteElement
  useEffect(() => {
    if (!ready || !containerRef.current || pacRef.current) return;

    try {
      const pac = new window.google.maps.places.PlaceAutocompleteElement({
        includedRegionCodes: ['ca', 'us'],
        requestedLanguage: 'fr',
      });

      // Place selection event (replaces deprecated 'place_changed')
      pac.addEventListener('gmp-select', async ({ placePrediction }) => {
        try {
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] });
          const parsed = parsePlace(place);
          onChange(parsed.address);
          if (onPlaceSelect) onPlaceSelect(parsed);
        } catch (err) {
          console.warn('Place fetch error:', err);
        }
      });

      containerRef.current.appendChild(pac);
      pacRef.current = pac;

      // Pre-fill + injecter du CSS dans le shadow DOM pour nettoyer le look
      requestAnimationFrame(() => {
        try {
          if (initialValue.current) pac.value = initialValue.current;
        } catch {}
        try {
          const shadow = pac.shadowRoot;
          if (shadow) {
            const style = document.createElement('style');
            style.textContent = [
              ':host { border: none !important; background: transparent !important; padding: 0 !important; }',
              '* { border: none !important; box-shadow: none !important; }',
              'input { background: transparent !important; outline: none !important; padding: 0 !important; color: inherit !important; font-family: inherit !important; font-size: inherit !important; width: 100% !important; }',
              'svg, button, [class*="icon"], [class*="clear"], [class*="search"] { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; }',
            ].join('\n');
            shadow.prepend(style);
          }
        } catch {}
      });
    } catch (err) {
      console.warn('PlaceAutocompleteElement error:', err);
      setApiError(true);
    }

    return () => {
      if (pacRef.current && containerRef.current?.contains(pacRef.current)) {
        containerRef.current.removeChild(pacRef.current);
        pacRef.current = null;
      }
    };
  }, [ready]);

  // Fallback: regular input when Google Maps unavailable or loading
  if (apiError || !ready) {
    return (
      <input
        type="text"
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={className}
        placeholder={placeholder}
        autoComplete="address-line1"
        required={required}
      />
    );
  }

  // Google Places autocomplete container
  return <div ref={containerRef} id={id} className="address-autocomplete-wrapper" />;
}
