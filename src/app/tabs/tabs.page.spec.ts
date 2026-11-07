import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { TabsPage } from './tabs.page';
import { createTranslateServiceMock } from '@testing/translate-service.mock';


describe('TabsPage', () => {
  let component: TabsPage;
  let fixture: ComponentFixture<TabsPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TabsPage],
      imports: [TranslateModule.forRoot(), IonicModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: {}, params: of({}) } },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
