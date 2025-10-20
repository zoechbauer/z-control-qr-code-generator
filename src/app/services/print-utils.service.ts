import { Injectable, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { QrCodeGapSize, QrCodesCountPerPage, QrCodeSize } from '../enums';
import { LocalStorageService } from './local-storage.service';
import {
  QrCodeGapSizes,
  QrCodeSizes,
} from '../ui/components/accordions/print-accordion.component';

export interface PrintSettings {
  size: QrCodeSize;
  gap: QrCodeGapSize;
  typeOfQrCodesPerPage: QrCodesCountPerPage;
  numberOfQrCodesPerPage: number;
}
@Injectable({
  providedIn: 'root',
})
export class PrintUtilsService implements OnDestroy {
  qrDataInputSub = new BehaviorSubject<number>(1);
  qrDataInput$ = this.qrDataInputSub.asObservable();

  private cols: number = 1;
  private rows: number = 1;
  private readonly pageA4Width: number = 210;
  private readonly pageA4Height: number = 297;
  private size!: QrCodeSize;
  private gap!: QrCodeGapSize;
  private numberOfQrCodes!: number;
  private qrCodeSizes: QrCodeSizes[] = [];
  private qrCodeGapSizes: QrCodeGapSizes[] = [];
  private qrDataInputLength: number = 1;
  private readonly subs = new Subscription();

  constructor(
    public translate: TranslateService,
    private readonly localStorageService: LocalStorageService
  ) {
    this.loadAvailableQrCodeSizesAndGapSizes();

    this.subs.add(
      this.translate.onLangChange.subscribe(() => {
        this.loadAvailableQrCodeSizesAndGapSizes();
      })
    );

    this.subs.add(
      this.localStorageService.savedPrintSettings$.subscribe((settings) => {
        this.size = settings.size;
        this.gap = settings.gap;
        this.numberOfQrCodes = settings.numberOfQrCodesPerPage;
      })
    );

    this.subs.add(
      this.qrDataInputSub.subscribe((textLength) => {
        this.qrDataInputLength = textLength;
      })
    );
  }

  getCalculatedNumberOfQrCodesPerPage(
    size: QrCodeSize = this.size,
    gap: QrCodeGapSize = this.gap
  ): number {
    const qrSize = size * 10 * this.scalingFactor(); // convert cm to mm and apply scaling factor
    const gapMm = gap * 10; // convert cm to mm

    // Calculate number of columns and rows that fit
    this.cols = Math.max(
      Math.floor((this.pageA4Width + gapMm) / (qrSize + gapMm)),
      1
    );
    this.rows = Math.max(
      Math.floor((this.pageA4Height + gapMm) / (qrSize + gapMm)),
      1
    );
    return this.cols * this.rows;
  }

  getConvertedPrintSettings(): string {
    if (this.numberOfQrCodes === 1) {
      return `[ ${this.getConvertedLabel(this.size)} / 1 ]`;
    } else {
      return `[ ${this.getConvertedLabel(this.size)} / ${this.getConvertedLabel(
        this.gap
      )} / ${this.getEffectiveNumberOfQrCodesPerPage()} ]`;
    }
  }

  private getConvertedLabel(size: QrCodeSize | QrCodeGapSize): string {
    // Search in qrCodeSizes
    const sizeObj = this.qrCodeSizes.find((s) => s.value === size);
    if (sizeObj) {
      return this.translate.instant(sizeObj.label);
    }
    // Search in qrCodeGapSizes
    const gapObj = this.qrCodeGapSizes.find((g) => g.value === size);
    if (gapObj) {
      return this.translate.instant(gapObj.label);
    }
    return '';
  }

  protected createPdf(options?: any): any {
    return new (jsPDF as any)(options);
  }

  printQRCode(dataUrl: string): Blob {
    const pdf = this.createPdf({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const qrSize = this.size * 10 * this.scalingFactor(); // convert cm to mm and apply scaling factor
    const gapMm = this.gap * 10; // convert cm to mm

    if (this.numberOfQrCodes === -1) {
      // Calculate the number of QR codes that fit on the page based on the provided text length
      this.numberOfQrCodes = this.getCalculatedNumberOfQrCodesPerPage();
    }
    // Calculate margin to center the grid
    const totalGridWidth = this.cols * qrSize + (this.cols - 1) * gapMm;
    const totalGridHeight = this.rows * qrSize + (this.rows - 1) * gapMm;
    const marginX = (this.pageA4Width - totalGridWidth) / 2;
    const marginY = (this.pageA4Height - totalGridHeight) / 2;

    // Generate and position QR codes on an A4 page
    for (let i = 0; i < this.numberOfQrCodes; i++) {
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);

      const x = marginX + col * (qrSize + gapMm);
      const y = marginY + row * (qrSize + gapMm);

      pdf.addImage(dataUrl, 'PNG', x, y, qrSize, qrSize);
    }
    return pdf.output('blob');
  }

  // on initialization -1 indicates full page, convert it to actual number
  getEffectiveNumberOfQrCodesPerPage(): number {
    return this.numberOfQrCodes === -1
      ? this.getCalculatedNumberOfQrCodesPerPage()
      : this.numberOfQrCodes;
  }

  getAvailableQrCodeSizesAndGapSizes(): {
    qrCodeSizes: QrCodeSizes[];
    qrCodeGapSizes: QrCodeGapSizes[];
  } {
    return {
      qrCodeSizes: this.qrCodeSizes,
      qrCodeGapSizes: this.qrCodeGapSizes,
    };
  }

  private scalingFactor(): number {
    // My assumptions: The created QR code size is linearly dependent on the text length, regardless of the print size.
    // Therefore, I created an interpolation table for a 15cm QR code size and scale the QR code size according to the text length.
    // This way, the print size is always the same, whether the text is short or long.
    // The actual size of the printed QR code may differ slightly from the size specified in the print options.
    return this.getPrintSize();
  }

  private getPrintSize(): number {
    const measuredSize = this.interpolateQrSizeFor15cm(this.qrDataInputLength);
    const targetSize = 150; // mm
    return targetSize / measuredSize;
  }

  private interpolateQrSizeFor15cm(x: number): number {
    // measured sizes for 15cm, tested by setting getPrintSize.return = 1;
    // x= text length, y= size in mm
    if (!Number.isFinite(x)) return 150; // default for invalid numbers

    const points = [
      { x: 1, y: 108.5 },
      { x: 4, y: 108.7 },
      { x: 30, y: 117.9 },
      { x: 50, y: 121.2 },
      { x: 75, y: 123.8 },
      { x: 100, y: 126.0 },
      { x: 150, y: 129.6 },
      { x: 200, y: 132.0 },
      { x: 250, y: 133.2 },
      { x: 300, y: 134.4 },
      { x: 350, y: 135.5 },
      { x: 400, y: 135.5 },
      { x: 450, y: 136.8 },
      { x: 500, y: 138.0 },
      { x: 600, y: 138.0 },
      { x: 700, y: 139.0 },
      { x: 800, y: 140.1 },
      { x: 900, y: 140.3 },
      { x: 1000, y: 141.4 },
    ];

    if (x <= points[0].x) return points[0].y; // min chars
    if (x >= points[points.length - 1].x) return points[points.length - 1].y;

    for (let i = 1; i < points.length; i++) {
      if (x < points[i].x) {
        const x0 = points[i - 1].x;
        const y0 = points[i - 1].y;
        const x1 = points[i].x;
        const y1 = points[i].y;
        // linear interpolation
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return 150; // fallback
  }

  loadAvailableQrCodeSizesAndGapSizes() {
    this.qrCodeSizes = [
      {
        label: this.translate.instant('QrCodeSize.SMALL'),
        value: QrCodeSize.SMALL,
      },
      {
        label: this.translate.instant('QrCodeSize.MEDIUM'),
        value: QrCodeSize.MEDIUM,
      },
      {
        label: this.translate.instant('QrCodeSize.LARGE'),
        value: QrCodeSize.LARGE,
      },
      {
        label: this.translate.instant('QrCodeSize.XLARGE'),
        value: QrCodeSize.XLARGE,
      },
    ];

    this.qrCodeGapSizes = [
      {
        label: this.translate.instant('QrCodeGapSize.SMALL'),
        value: QrCodeGapSize.SMALL,
      },
      {
        label: this.translate.instant('QrCodeGapSize.LARGE'),
        value: QrCodeGapSize.LARGE,
      },
    ];
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
