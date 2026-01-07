import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter } from 'react-router-dom'
// import Layout from './Layout/Layout.jsx'

const router = 
<BrowserRouter>
  <App />
</BrowserRouter>;

createRoot(document.getElementById('root')).render(
  <StrictMode>
   {router}
  </StrictMode>,
)
