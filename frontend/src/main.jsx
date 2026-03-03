import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
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
            <CartProvider>
              <App />
            </CartProvider>
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
