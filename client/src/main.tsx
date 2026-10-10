import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Mismo orden que el antiguo styles.css: la cascada depende de él.
import './styles/tokens.css';
import './styles/base.css';
import './styles/printer.css';
import './styles/sale.css';
import './styles/products.css';
import './styles/designer.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
