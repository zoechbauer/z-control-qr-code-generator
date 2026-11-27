import { TranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createTranslateServiceMock } from '@testing/translate-service.mock';

import { FeedbackAccordionComponent } from './feedback-accordion.component';

describe('FeedbackAccordionComponent', () => {
  let component: FeedbackAccordionComponent;
  let fixture: ComponentFixture<FeedbackAccordionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeedbackAccordionComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
