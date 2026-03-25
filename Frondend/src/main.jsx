import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <GoogleOAuthProvider clientId="515795235834-u4s88flf4tmfokjn6kfrhrejncl8jjcc.apps.googleusercontent.com">
      <App />
      </GoogleOAuthProvider>
    
  </StrictMode>,
)