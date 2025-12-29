
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro del Service Worker para modo PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Llavpodes SW registrado'))
      .catch(err => console.log('Error registrando SW', err));
  });
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
