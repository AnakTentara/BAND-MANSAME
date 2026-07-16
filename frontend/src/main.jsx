import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './styles/main.css';
import './styles/skeleton.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.875rem',
          borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          color: '#0f172a',
        },
        success: {
          iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
        },
      }}
    />
  </React.StrictMode>
);
