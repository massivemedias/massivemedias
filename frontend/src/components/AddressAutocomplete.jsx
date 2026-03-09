import { useEffect, useRef, useState, useCallback } from 'react';

// Read API key at runtime (not build time) to avoid Vite tree-shaking
function getApiKey() {
  return import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
}

// Load Google Maps + Places library once
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
 * Utilise AutocompleteSuggestion (data-only API) + notre propre input/dropdown
 * Zero shadow DOM, zero icone Google, controle total du style
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
  const [ready, setReady] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Load Google Maps
  useEffect(() => {
    let mounted = true;
    loadGoogleMaps()
      .then(() => { if (mounted) setReady(true); })
      .catch((err) => console.warn('Google Maps:', err.message));
    return () => { mounted = false; };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch autocomplete suggestions (data-only, no widget)
  const fetchSuggestions = useCallback(async (input) => {
    if (!ready || !input || input.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const { suggestions: results } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        includedRegionCodes: ['ca', 'us'],
        language: 'fr',
      });
      setSuggestions(results || []);
      setShowDropdown((results || []).length > 0);
      setSelectedIndex(-1);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [ready]);

  function handleInputChange(e) {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  async function handleSelect(suggestion) {
    setShowDropdown(false);
    setSuggestions([]);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] });
      const parsed = parsePlace(place);
      onChange(parsed.address);
      if (onPlaceSelect) onPlaceSelect(parsed);
    } catch (err) {
      console.warn('Place fetch error:', err);
    }
  }

  function handleKeyDown(e) {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        id={id}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="address-suggestions">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className={'address-suggestion-item' + (i === selectedIndex ? ' selected' : '')}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="suggestion-main">
                {s.placePrediction?.mainText?.text || ''}
              </span>
              <span className="suggestion-secondary">
                {s.placePrediction?.secondaryText?.text || ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
