import { useEffect, useRef, useState } from 'react';

// Read API key at runtime (not build time) to avoid Vite tree-shaking
function getApiKey() {
  return import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
}

// Load Google Maps script once
let loadPromise = null;
function loadGoogleMaps() {
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const key = getApiKey();
  if (!key) return Promise.reject(new Error('No Google Places API key configured'));

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places&language=fr';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return loadPromise;
}

// Parse Google Place into structured address
function parsePlace(place) {
  const result = { address: '', city: '', province: '', postalCode: '', country: '' };
  if (!place.address_components) return result;

  let streetNumber = '';
  let route = '';

  for (const c of place.address_components) {
    const type = c.types[0];
    if (type === 'street_number') streetNumber = c.long_name;
    if (type === 'route') route = c.long_name;
    if (type === 'locality' || type === 'sublocality_level_1') result.city = c.long_name;
    if (type === 'administrative_area_level_1') result.province = c.short_name;
    if (type === 'postal_code') result.postalCode = c.long_name;
    if (type === 'country') result.country = c.long_name;
  }

  result.address = [streetNumber, route].filter(Boolean).join(' ');
  return result;
}

/**
 * AddressAutocomplete - Champ adresse avec Google Places suggestions
 *
 * Props:
 * - value: string
 * - onChange: (address: string) => void
 * - onPlaceSelect: ({ address, city, province, postalCode, country }) => void
 * - className, placeholder, id, autoComplete, required
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
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setLoaded(true))
      .catch((err) => console.warn('Google Maps:', err.message));
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: ['ca', 'us'] },
      fields: ['address_components', 'formatted_address'],
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.address_components) return;

      const parsed = parsePlace(place);
      // Update input value with the street address
      onChange(parsed.address);
      // Fill all fields
      if (onPlaceSelect) onPlaceSelect(parsed);
    });

    autocompleteRef.current = ac;

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [loaded]);

  return (
    <input
      ref={inputRef}
      type="text"
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
      autoComplete="off"
      required={required}
    />
  );
}
