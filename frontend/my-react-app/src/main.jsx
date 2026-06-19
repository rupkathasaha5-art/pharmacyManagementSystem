import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom' 
import { AppContextProvider } from './context/AppContext.jsx'
import { CatalogContextProvider } from './context/CatalogContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <AppContextProvider>
    <CatalogContextProvider>
      <App />
    </CatalogContextProvider>
  </AppContextProvider>  
  </BrowserRouter>,
)