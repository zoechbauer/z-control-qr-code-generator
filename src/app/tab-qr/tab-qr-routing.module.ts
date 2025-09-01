import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabQrPage } from './tab-qr.page';

const routes: Routes = [
  {
    path: '',
    component: TabQrPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabQrPageRoutingModule {}
