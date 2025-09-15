import { LocalStorageService } from 'src/app/services/local-storage.service';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  QrCodeSize,
  QrCodeGapSize,
  QrCodesCountPerPage,
} from './../../../enums';
import {
  PrintSettings,
  PrintUtilsService,
} from 'src/app/services/print-utils.service';
import { ToastService } from 'src/app/services/toast.service';

interface QrCodeSizes {
  label: string;
  value: QrCodeSize;
}

interface QrCodeGapSizes {
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
export class PrintAccordionComponent implements OnInit {
  @Input() lang?: string;

  QrCodesCountPerPage = QrCodesCountPerPage;
  qrCodeSizes!: QrCodeSizes[];
  qrCodeGapSizes: QrCodeGapSizes[] = [];
  qrCodesCountPerPages: QrCodesCountPerPages[] = [];
  selectedQrCodeSize: QrCodeSize = QrCodeSize.XSMALL;
  selectedQrCodeGapSize: QrCodeGapSize = QrCodeGapSize.SMALL;
  selectedTypeOfQrCodesPerPage: QrCodesCountPerPage = QrCodesCountPerPage.FULL_PAGE;
  selectedNumberOfQrCodesPerPage: number = 1;
  private saveddNumberOfQrCodesPerPage!: number;

  constructor(
    public translate: TranslateService,
    private readonly printUtilsService: PrintUtilsService,
    private readonly toastService: ToastService,
    private readonly localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    this.loadAvailablePrintSettings();
    this.loadPrintSettings();
  }

  getPrintSettings(): string {
    return this.printUtilsService.getConvertedPrintSettings();
  }

  get calculatedNumberOfQrCodesPerPage(): number {
    if (this.selectedTypeOfQrCodesPerPage === QrCodesCountPerPage.CUSTOM_NUMBER) {
      return this.printUtilsService.getEffectiveNumberOfQrCodesPerPage();
    }
    return this.printUtilsService.getCalculatedNumberOfQrCodesPerPage(this.selectedQrCodeSize, this.selectedQrCodeGapSize);
  }

  get maxCalculatedNumberOfQrCodesPerPage(): number {
    return this.printUtilsService.getCalculatedNumberOfQrCodesPerPage(this.selectedQrCodeSize, this.selectedQrCodeGapSize);
  }

  onPrintSettingChange() {
    let numberOfQrCodes = this.maxCalculatedNumberOfQrCodesPerPage; 
    if (this.selectedTypeOfQrCodesPerPage === QrCodesCountPerPage.CUSTOM_NUMBER) {
      if (this.selectedNumberOfQrCodesPerPage > 0 && this.selectedNumberOfQrCodesPerPage <= numberOfQrCodes) {
        numberOfQrCodes = this.selectedNumberOfQrCodesPerPage;
      }
    }

    const settings: PrintSettings = {
      size: this.selectedQrCodeSize,
      gap: this.selectedQrCodeGapSize,
      typeOfQrCodesPerPage: this.selectedTypeOfQrCodesPerPage,
      numberOfQrCodesPerPage: numberOfQrCodes,
    };

    this.localStorageService.savePrintSettings(settings);
  }

  onNumberOfQrCodesChange(event: any) {
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
    this.localStorageService.savePrintSettings(settings);
  }

  private showErrorToast(maxValue: number) {
    const toastMessage = this.translate.instant('TOAST_INVALID_VALUE_ENTERED', {
      max: maxValue,
    });
    this.toastService.showToast(toastMessage);
  }

  private loadAvailablePrintSettings() {
    this.qrCodeSizes = [
      { label: this.translate.instant('QrCodeSize.XSMALL'), value: QrCodeSize.XSMALL },
      { label: this.translate.instant('QrCodeSize.SMALL'), value: QrCodeSize.SMALL },
      { label: this.translate.instant('QrCodeSize.MEDIUM'), value: QrCodeSize.MEDIUM },
      { label: this.translate.instant('QrCodeSize.LARGE'), value: QrCodeSize.LARGE },
      { label: this.translate.instant('QrCodeSize.XLARGE'), value: QrCodeSize.XLARGE },
    ];

    this.qrCodeGapSizes = [
      { label: this.translate.instant('QrCodeGapSize.SMALL'), value: QrCodeGapSize.SMALL },
      { label: this.translate.instant('QrCodeGapSize.MEDIUM'), value: QrCodeGapSize.MEDIUM },
      { label: this.translate.instant('QrCodeGapSize.LARGE'), value: QrCodeGapSize.LARGE },
    ];

    this.qrCodesCountPerPages = [
      { label: this.translate.instant('QrCodesCountPerPage.FULL_PAGE'), value: QrCodesCountPerPage.FULL_PAGE },
      { label: this.translate.instant('QrCodesCountPerPage.CUSTOM_NUMBER'), value: QrCodesCountPerPage.CUSTOM_NUMBER },
    ];
  }

  private async loadPrintSettings() {
    this.localStorageService.savedPrintSettings$.subscribe((settings) => {
      this.selectedQrCodeSize = settings.size;
      this.selectedQrCodeGapSize = settings.gap;
      this.selectedTypeOfQrCodesPerPage = settings.typeOfQrCodesPerPage;
      this.selectedNumberOfQrCodesPerPage = settings.numberOfQrCodesPerPage;

      this.saveddNumberOfQrCodesPerPage =
        this.printUtilsService.getEffectiveNumberOfQrCodesPerPage();
    });
  }
}
