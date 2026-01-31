import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('Starting app render...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px;">Error: Root element not found</div>';
} else {
  try {
    console.log('Creating root...');
    const root = createRoot(rootElement);
    console.log('Rendering app...');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Failed to render app:', error);
    console.error('Error stack:', error.stack);
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; background: #fee; border: 2px solid #f00;">
        <h1>Application Error</h1>
        <p>Failed to load the application. Please check the console for details.</p>
        <pre style="background: #fff; padding: 10px; border: 1px solid #ccc;">${error.message}\n\n${error.stack}</pre>
      </div>
    `;
  }
}
