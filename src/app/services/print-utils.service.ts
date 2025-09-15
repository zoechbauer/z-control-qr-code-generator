import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

import { QrCodeGapSize, QrCodesCountPerPage, QrCodeSize } from '../enums';
import { LocalStorageService } from './local-storage.service';

export interface PrintSettings {
  size: QrCodeSize;
  gap: QrCodeGapSize;
  typeOfQrCodesPerPage: QrCodesCountPerPage;
  numberOfQrCodesPerPage: number;
}
@Injectable({
  providedIn: 'root',
})
export class PrintUtilsService {
  private cols: number = 0;
  private rows: number = 0;
  private readonly pageA4Width: number = 210;
  private readonly pageA4Height: number = 297;
  private size!: QrCodeSize;
  private gap!: QrCodeGapSize;
  private numberOfQrCodes!: number;

  constructor(private readonly localStorageService: LocalStorageService) {

    this.localStorageService.savedPrintSettings$.subscribe((settings) => {
      this.size = settings.size;
      this.gap = settings.gap;
      this.numberOfQrCodes = settings.numberOfQrCodesPerPage;
    });
  }

  getCalculatedNumberOfQrCodesPerPage(
    size: QrCodeSize = this.size,
    gap: QrCodeGapSize = this.gap
  ): number {
    const qrSize = size * 10; // convert cm to mm
    const gapMm = gap * 10; // convert cm to mm

    // Calculate number of columns and rows that fit
    this.cols = Math.floor((this.pageA4Width + gapMm) / (qrSize + gapMm));
    this.rows = Math.floor((this.pageA4Height + gapMm) / (qrSize + gapMm));
    return this.cols * this.rows;
  }

  getConvertedPrintSettings(): string {
    console.log(
      'getConvertedPrintSettings memberVars',
      this.size,
      this.gap,
      this.numberOfQrCodes
    );

    if (this.numberOfQrCodes === 1) {
      return `[${this.getConvertedLabel(this.size)} / 1]`;
    } else {
      return `[${this.getConvertedLabel(this.size)} / ${this.getConvertedLabel(
        this.gap
      )} / ${this.getEffectiveNumberOfQrCodesPerPage()}]`;
    }
  }

  private getConvertedLabel(size: QrCodeSize | QrCodeGapSize): string {
    const label = QrCodeSize[size] || QrCodeGapSize[size];
    if (!label) return '';
    return label.startsWith('X')
      ? label.substring(0, 2)
      : label.substring(0, 1);
  }

  printQRCode(dataUrl: string): Blob {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const qrSize = this.size * 10; // convert cm to mm
    const gapMm = this.gap * 10; // convert cm to mm

    if (this.numberOfQrCodes <= 0) {
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
}
