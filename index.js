import React from 'react';
import ReactDOM from 'react-dom/client';
import SSystemTracker from './src/s-system-tracker'; // Your main component

// Get the root element from index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render your app
root.render(
  <React.StrictMode>
    <SSystemTracker />
  </React.StrictMode>
);
export default SSystemTracker;