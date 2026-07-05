// AUTOCOMPLETE-CLIENT (4 juillet 2026) : filtrage local des comptes clients
// Supabase pour l'autocomplete de la commande manuelle (CreateManualOrderModal).
// La liste complete est chargee UNE fois par le modal (volume minuscule, ~21
// comptes au moment d'ecrire) puis filtree en memoire a la frappe. Aucune
// requete serveur par frappe.

// Minuscules + retrait des accents, pour matcher "jerome" avec "Jérôme"
export function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Chiffres seulement, pour matcher "514 555" avec "(514) 555-1234"
function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

export const CLIENT_SEARCH_MIN_CHARS = 2
export const CLIENT_SEARCH_MAX_RESULTS = 8

// accounts : [{ fullName, email, company, phone }]
// term : saisie brute de l'admin
// Retourne les comptes dont le nom, le courriel, l'entreprise OU le telephone
// contient le terme (insensible casse/accents, telephone compare en chiffres
// seulement). Cap a CLIENT_SEARCH_MAX_RESULTS pour garder le dropdown court.
export function filterClientAccounts(accounts, term) {
  const normTerm = normalizeSearchText(term).trim()
  if (normTerm.length < CLIENT_SEARCH_MIN_CHARS) return []
  const termDigits = digitsOnly(normTerm)
  const results = []
  for (const account of accounts || []) {
    const haystack = [account.fullName, account.email, account.company]
      .map(normalizeSearchText)
      .join(' ')
    const phoneDigits = digitsOnly(account.phone)
    const phoneMatch =
      termDigits.length >= CLIENT_SEARCH_MIN_CHARS && phoneDigits.includes(termDigits)
    if (haystack.includes(normTerm) || phoneMatch) {
      results.push(account)
      if (results.length >= CLIENT_SEARCH_MAX_RESULTS) break
    }
  }
  return results
}
