import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp, getApp } from '@angular/fire/app';
import { getAuth, provideAuth, browserLocalPersistence, initializeAuth, indexedDBLocalPersistence, browserPopupRedirectResolver } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => {
      if (typeof window !== 'undefined') {
        const app = getApp();
        const auth = initializeAuth(app, {
          persistence: [indexedDBLocalPersistence, browserLocalPersistence],
          popupRedirectResolver: browserPopupRedirectResolver,
        });
        return auth;
      }
      return getAuth();
    }),
    provideFirestore(() => {
      const app = getApp();
      return getFirestore(app);
    }),
  ],
};
