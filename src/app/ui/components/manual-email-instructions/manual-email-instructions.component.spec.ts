import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualEmailInstructionsComponent } from 'src/app/ui/components/manual-email-instructions/manual-email-instructions.component';
import { ModalController, IonicModule } from '@ionic/angular';

describe('ManualEmailInstructionsComponent', () => {
  let component: ManualEmailInstructionsComponent;
  let fixture: ComponentFixture<ManualEmailInstructionsComponent>;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;

  beforeEach(async () => {
    modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [ManualEmailInstructionsComponent, IonicModule.forRoot()],
      providers: [{ provide: ModalController, useValue: modalControllerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ManualEmailInstructionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call modalController.dismiss when dismiss is called', () => {
    component.dismiss();
    expect(modalControllerSpy.dismiss).toHaveBeenCalled();
  });

  it('should call modalController.dismiss with destructive role when shouldCopyTextAndDismiss is called', () => {
    component.shouldCopyTextAndDismiss();
    expect(modalControllerSpy.dismiss).toHaveBeenCalledWith(
      undefined,
      'destructive',
    );
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

  describe('displayedQrText', () => {
    it('should return the QR text', () => {
      component.qrText = 'QR123';
      expect(component.displayedQrText).toBe('QR123');
    });

    it('should return first 400 chars with ellipsis on long QR text', () => {
      const longText = 'A'.repeat(500);
      component.qrText = longText;
      expect(component.displayedQrText).toBe('A'.repeat(400) + ' ...');
    });
  });
});
