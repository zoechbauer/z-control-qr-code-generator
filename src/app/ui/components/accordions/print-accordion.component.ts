import { LocalStorageService } from 'src/app/services/local-storage.service';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  QrCodeSize,
  QrCodeGapSize,
  QrCodesCountPerPage,
} from '@app/enums';
import {
  PrintSettings,
  PrintUtilsService,
} from 'src/app/services/print-utils.service';
import { ToastService } from 'src/app/services/toast.service';
import { Subscription } from 'rxjs';

export interface QrCodeSizes {
  label: string;
  value: QrCodeSize;
}

export interface QrCodeGapSizes {
  label: string;
  value: QrCodeGapSize;
}

interface QrCodesCountPerPages {
  label: string;
  value: QrCodesCountPerPage;
}

@Component({
  selector: 'app-print-accordion',
  templateUrl: './print-accordion.component.html',
  standalone: true,
  imports: [
    IonIcon,
    IonInput,
    IonAccordion,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    TranslateModule,
    CommonModule,
    FormsModule,
  ],
})
export class PrintAccordionComponent implements OnInit, OnDestroy {
  @Input() lang?: string;

  QrCodesCountPerPage = QrCodesCountPerPage;
  qrCodeSizes!: QrCodeSizes[];
  qrCodeGapSizes: QrCodeGapSizes[] = [];
  qrCodesCountPerPages: QrCodesCountPerPages[] = [];
  selectedQrCodeSize: QrCodeSize = QrCodeSize.MEDIUM;
  selectedQrCodeGapSize: QrCodeGapSize = QrCodeGapSize.SMALL;
  selectedTypeOfQrCodesPerPage: QrCodesCountPerPage =
    QrCodesCountPerPage.FULL_PAGE;
  selectedNumberOfQrCodesPerPage: number = 1;
  private saveddNumberOfQrCodesPerPage!: number;
  private readonly subs = new Subscription();

  constructor(
    public translate: TranslateService,
    private readonly printUtilsService: PrintUtilsService,
    private readonly toastService: ToastService,
    private readonly localStorageService: LocalStorageService
  ) {}

  /**
   * Initializes the component by loading available print settings and setting up subscriptions.
   */
  ngOnInit() {
    this.loadAvailablePrintSettings();
    this.setupSubscriptions();
  }

  /**
   * Sets up subscriptions to listen for changes in saved print settings.
   * Updates the component state accordingly.
   */
  private setupSubscriptions() {
    this.subs.add(
      this.localStorageService.savedPrintSettings$.subscribe((settings) => {
        this.selectedQrCodeSize = settings.size;
        this.selectedQrCodeGapSize = settings.gap;
        this.selectedTypeOfQrCodesPerPage = settings.typeOfQrCodesPerPage;
        this.selectedNumberOfQrCodesPerPage = settings.numberOfQrCodesPerPage;

        this.saveddNumberOfQrCodesPerPage =
          this.printUtilsService.getEffectiveNumberOfQrCodesPerPage();
      })
    );
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  getPrintSettings(): string {
    return this.printUtilsService.getConvertedPrintSettings();
  }

  /**
   * Calculates the number of QR codes per page based on the selected settings.
   */
  get calculatedNumberOfQrCodesPerPage(): number {
    if (
      this.selectedTypeOfQrCodesPerPage === QrCodesCountPerPage.CUSTOM_NUMBER
    ) {
      return this.printUtilsService.getEffectiveNumberOfQrCodesPerPage();
    }
    return this.printUtilsService.getCalculatedNumberOfQrCodesPerPage(
      this.selectedQrCodeSize,
      this.selectedQrCodeGapSize
    );
  }

  /**
   * Gets the maximum calculated number of QR codes per page based on the selected settings.
   */
  get maxCalculatedNumberOfQrCodesPerPage(): number {
    return this.printUtilsService.getCalculatedNumberOfQrCodesPerPage(
      this.selectedQrCodeSize,
      this.selectedQrCodeGapSize
    );
  }

  /**
   * Handles changes to the print settings and updates the saved settings accordingly.
   */
  async onPrintSettingChange() {
    let numberOfQrCodes = this.maxCalculatedNumberOfQrCodesPerPage;
    if (
      this.selectedTypeOfQrCodesPerPage === QrCodesCountPerPage.CUSTOM_NUMBER
    ) {
      if (
        this.selectedNumberOfQrCodesPerPage > 0 &&
        this.selectedNumberOfQrCodesPerPage <= numberOfQrCodes
      ) {
        numberOfQrCodes = this.selectedNumberOfQrCodesPerPage;
      }
    } else {
      numberOfQrCodes = -1; // indicates full page
    }

    const settings: PrintSettings = {
      size: this.selectedQrCodeSize,
      gap: this.selectedQrCodeGapSize,
      typeOfQrCodesPerPage: this.selectedTypeOfQrCodesPerPage,
      numberOfQrCodesPerPage: numberOfQrCodes,
    };

    await this.localStorageService.savePrintSettings(settings);
  }

  /**
   * Handles changes to the number of QR codes per page and updates the saved settings accordingly.
   */
  async onNumberOfQrCodesChange(event: any) {
    const value = Number(event.target.value);
    const maxValue = this.maxCalculatedNumberOfQrCodesPerPage;

    if (value > maxValue || value < 1) {
      this.showErrorToast(maxValue);
      return;
    }
    // correct value
    this.selectedNumberOfQrCodesPerPage = value;

    const settings: PrintSettings = {
      size: this.selectedQrCodeSize,
      gap: this.selectedQrCodeGapSize,
      typeOfQrCodesPerPage: this.selectedTypeOfQrCodesPerPage,
      numberOfQrCodesPerPage: this.selectedNumberOfQrCodesPerPage,
    };
    await this.localStorageService.savePrintSettings(settings);
  }

  /**
   * Shows an error toast indicating the maximum allowed value.
   */
  private showErrorToast(maxValue: number) {
    const toastMessage = this.translate.instant('TOAST_INVALID_VALUE_ENTERED', {
      max: maxValue,
    });
    this.toastService.showToast(toastMessage);
  }

  /**
   * Loads the available print settings such as QR code sizes and gap sizes.
   */
  private loadAvailablePrintSettings() {
    const { qrCodeSizes, qrCodeGapSizes } =
      this.printUtilsService.getAvailableQrCodeSizesAndGapSizes();
    this.qrCodeSizes = qrCodeSizes;
    this.qrCodeGapSizes = qrCodeGapSizes;

    this.qrCodesCountPerPages = [
      {
        label: this.translate.instant('QrCodesCountPerPage.FULL_PAGE'),
        value: QrCodesCountPerPage.FULL_PAGE,
      },
      {
        label: this.translate.instant('QrCodesCountPerPage.CUSTOM_NUMBER'),
        value: QrCodesCountPerPage.CUSTOM_NUMBER,
      },
    ];
  }

  /**
   * Cleans up any subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
