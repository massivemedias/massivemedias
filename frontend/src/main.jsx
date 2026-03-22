import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { UserRoleProvider } from './contexts/UserRoleContext'
import { CookieProvider } from './contexts/CookieContext'
import { SiteContentProvider } from './hooks/useSiteContent'
import { ServicePagesProvider } from './hooks/useServicePages'
import { ArtistsProvider } from './hooks/useArtists'
import { TatoueursProvider } from './hooks/useTatoueurs'
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
        <TatoueursProvider>
        <ProductsProvider>
        <CookieProvider>
          <AuthProvider>
            <UserRoleProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </UserRoleProvider>
          </AuthProvider>
        </CookieProvider>
        </ProductsProvider>
        </TatoueursProvider>
        </ArtistsProvider>
        </ServicePagesProvider>
        </SiteContentProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
