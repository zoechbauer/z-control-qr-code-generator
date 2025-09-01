import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabSettingsPage } from './tab-settings.page';

describe('TabSettingsPage', () => {
  let component: TabSettingsPage;
  let fixture: ComponentFixture<TabSettingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TabSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
