import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { BrowserRouter } from "react-router-dom";
import './index.css';
import { seedDevData } from './services/dataSeeder';
import { isLoginDomain, getAppBaseUrl, getAppLoginUrl } from './utils/domainUtils';

// login.fotoflow.co is the branded authentication entry. All auth happens on
// app.fotoflow.co so Firebase sessions are created and persisted there.
// Root requests forward to the login page; any other path (e.g. a shared
// gallery/project URL) is preserved and forwarded to the app unchanged.
if (isLoginDomain()) {
  const { pathname, search } = window.location;
  const target = pathname === '/' || pathname === '' ? getAppLoginUrl() : `${getAppBaseUrl()}${pathname}${search}`;
  window.location.replace(target);
}

const container = document.getElementById('root');
const root = createRoot(container);

// Seed data in development
if (process.env.NODE_ENV === 'development') {
  await seedDevData();
}

root.render(

    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
