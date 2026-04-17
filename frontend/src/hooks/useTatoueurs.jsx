// Stub désactivé - la section Tatoueurs a été retirée du site.
// On garde le Provider/hook vides pour que les imports existants ne cassent pas.
// À supprimer complètement quand toutes les references auront ete nettoyées.
import { createContext, useContext } from 'react';

const TatoueursContext = createContext({ tatoueurs: [], loading: false });

export function TatoueursProvider({ children }) {
  return (
    <TatoueursContext.Provider value={{ tatoueurs: [], loading: false }}>
      {children}
    </TatoueursContext.Provider>
  );
}

export function useTatoueurs() {
  return { tatoueurs: [], loading: false };
}
