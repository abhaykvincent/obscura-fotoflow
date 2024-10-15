import React from 'react';
import { hydrate } from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from "react-router-dom";
import './index.css';

const APP = () => (
  <HelmetProvider>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </HelmetProvider>
);

const rootElement = document.getElementById("root");

// Use hydrate to attach React to the pre-rendered static HTML.
hydrate(<APP />, rootElement);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
reportWebVitals();
