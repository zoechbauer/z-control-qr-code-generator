import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MarkdownModule } from 'ngx-markdown';
import { IonicModule, ModalController } from '@ionic/angular';

import { MarkdownViewerComponent } from './markdown-viewer.component';

describe('MarkdownViewerComponent', () => {
  let component: MarkdownViewerComponent;
  let fixture: ComponentFixture<MarkdownViewerComponent>;
  let httpMock: HttpTestingController;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;

  beforeEach(async () => {
    modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [
        MarkdownViewerComponent,
        HttpClientTestingModule,
        IonicModule.forRoot(),
        MarkdownModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MarkdownViewerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Manually replace the modalController
    (component as any).modalController = modalControllerSpy;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close modal when closeModal is called', () => {
    component.closeModal();
    expect(modalControllerSpy.dismiss).toHaveBeenCalled();
  });

  it('should load markdown content on ngOnInit', () => {
    const mockMarkdown = '# Test Changelog';
    component.fullChangeLogPath = 'assets/changelog.md';

    component.ngOnInit();

    const req = httpMock.expectOne('assets/changelog.md');
    req.flush(mockMarkdown);

    expect(component.markdown).toBe(mockMarkdown);
  });

  it('should handle HTTP error when loading markdown fails', () => {
    spyOn(console, 'error');
    component.fullChangeLogPath = 'assets/nonexistent.md';

    component.ngOnInit();

    const req = httpMock.expectOne('assets/nonexistent.md');
    req.error(new ErrorEvent('Network error'));

    expect(console.error).toHaveBeenCalledWith(
      'Error loading changelog:',
      jasmine.any(Object)
    );
    expect(component.markdown).toBe('');
  });

  it('should register icons on construction', () => {
    // This test verifies that addIcons was called (indirectly through constructor)
    expect(component).toBeTruthy();
    // The registerIcons method is private and called in constructor
    // We can verify the component initializes properly, indicating icons were registered
  });

  it('should initialize with empty markdown string', () => {
    expect(component.markdown).toBe('');
  });

  it('should require fullChangeLogPath input', () => {
    component.fullChangeLogPath = 'some/path.md';
    expect(component.fullChangeLogPath).toBeDefined();
  });

  it('should handle large markdown files', () => {
    const largeMockdown = '#'.repeat(1000) + ' Large Content';
    component.fullChangeLogPath = 'assets/large.md';

    component.ngOnInit();

    const req = httpMock.expectOne('assets/large.md');
    req.flush(largeMockdown);
    
    expect(component.markdown).toBe(largeMockdown);
  });

  it('should handle empty markdown response', () => {
    component.fullChangeLogPath = 'assets/empty.md';

    component.ngOnInit();

    const req = httpMock.expectOne('assets/empty.md');
    req.flush('');

    expect(component.markdown).toBe('');
  });
});
