import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/tabs/tab-qr',
    pathMatch: 'full'
  },
  {
    path: 'tab-qr',
    loadChildren: () => import('./tab-qr/tab-qr.module').then( m => m.TabQrPageModule)
  },
  {
    path: 'tab-settings',
    loadChildren: () => import('./tab-settings/tab-settings.module').then( m => m.TabSettingsPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then( m => m.TabsPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
