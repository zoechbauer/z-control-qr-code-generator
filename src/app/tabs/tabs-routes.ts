import { Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

/**
 * Defines the routes for the tabs component.
 */
export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'qr',
        loadComponent: () =>
          import('../tab-qr/tab-qr.page').then((m) => m.TabQrPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../tab-settings/tab-settings.page').then(
            (m) => m.TabSettingsPage,
          ),
      },
      {
        path: '',
        redirectTo: 'qr',
        pathMatch: 'full',
      },
    ],
  },
];
