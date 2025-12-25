
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// El archivo index.tsx ahora actúa como el punto de entrada principal
// que renderiza el componente App modularizado.

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
