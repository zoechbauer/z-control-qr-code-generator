import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualInstructionsModalComponent } from './manual-instructions-modal.component';
import {
  ModalController,
  IonicModule,
} from '@ionic/angular';

describe('ManualInstructionsModalComponent', () => {
  let component: ManualInstructionsModalComponent;
  let fixture: ComponentFixture<ManualInstructionsModalComponent>;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;

  beforeEach(async () => {
    modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      declarations: [ManualInstructionsModalComponent],
      providers: [{ provide: ModalController, useValue: modalControllerSpy }],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(ManualInstructionsModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call modalController.dismiss when dismiss is called', () => {
    component.dismiss();
    expect(modalControllerSpy.dismiss).toHaveBeenCalled();
  });

  it('should call copyCallback and then dismiss when copyAndDismiss is called', async () => {
    const copyCallbackSpy = jasmine
      .createSpy('copyCallback')
      .and.returnValue(Promise.resolve());
    component.copyCallback = copyCallbackSpy;
    spyOn(component, 'dismiss');
    await component.copyAndDismiss();
    expect(copyCallbackSpy).toHaveBeenCalled();
    expect(component.dismiss).toHaveBeenCalled();
  });

  it('should call dismiss even if copyCallback is not set', async () => {
    spyOn(component, 'dismiss');
    component.copyCallback = undefined as any;
    await component.copyAndDismiss();
    expect(component.dismiss).toHaveBeenCalled();
  });

  it('should render all @Input properties in the template', () => {
    component.title = 'Test Title';
    component.instructions = 'Test Instructions';
    component.qrText = 'QR123';
    component.qrTextLabel = 'QR Label';
    component.copyButtonLabel = 'Copy';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Title');
    expect(compiled.textContent).toContain('Test Instructions');
    expect(compiled.textContent).toContain('QR123');
    expect(compiled.textContent).toContain('QR Label');
    expect(compiled.textContent).toContain('Copy');
  });
});
