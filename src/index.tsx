
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Wait for DOM to be ready before mounting
const init = () => {
  console.log("init called");
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Fatal Error: Could not find root element to mount to");
    return;
  }

  console.log("mounting react app");
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

console.log("index.tsx loaded, readyState:", document.readyState);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
