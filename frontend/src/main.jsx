import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Keep-alive backend Render: ping le backend des que l'utilisateur arrive sur le site
// pour eviter qu'il dorme. Le Cloudflare Worker fait aussi un cron toutes les 5 min
// (defense en profondeur). Ce ping est declenche des le premier rendu, donc meme si
// le cron rate, le backend se reveille quand un client arrive sur le site.
// Pas de await - non-bloquant pour le rendu initial.
(() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://massivemedias-api.onrender.com';
  fetch(`${apiUrl}/api/artists`, { method: 'GET', mode: 'cors', cache: 'no-store' })
    .then(() => { /* backend awake */ })
    .catch(() => { /* ignore network errors - le worker cron nous couvre */ });
})();
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { UserRoleProvider } from './contexts/UserRoleContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { CookieProvider } from './contexts/CookieContext'
import { SiteContentProvider } from './hooks/useSiteContent'
import { ServicePagesProvider } from './hooks/useServicePages'
import { ArtistsProvider } from './hooks/useArtists'
import { ProductsProvider } from './hooks/useProducts'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <SiteContentProvider>
        <ServicePagesProvider>
        <ArtistsProvider>
        <ProductsProvider>
        <CookieProvider>
          <AuthProvider>
            <UserRoleProvider>
              <NotificationProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </NotificationProvider>
            </UserRoleProvider>
          </AuthProvider>
        </CookieProvider>
        </ProductsProvider>
        </ArtistsProvider>
        </ServicePagesProvider>
        </SiteContentProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
