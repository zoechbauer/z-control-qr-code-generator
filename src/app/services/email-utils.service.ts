import { Injectable } from '@angular/core';
import { Attachment, EmailComposer } from 'capacitor-email-composer';
import { Capacitor } from '@capacitor/core';

import { FileUtilsService } from './file-utils.service';
import { LocalStorageService } from './local-storage.service';
import { QrUtilsService } from './qr-utils.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root',
})
export class EmailUtilsService {
  private emailSent = false;

  constructor(
    private readonly fileService: FileUtilsService,
    private readonly localStorage: LocalStorageService,
    private readonly qrService: QrUtilsService,
    private readonly translate: TranslateService,
    private readonly alertService: AlertService
  ) {}

  get isEmailSent(): boolean {
    return this.emailSent;
  }

  isValidEmailAddress(emailAddress: string | number): boolean {
    if (typeof emailAddress !== 'string') {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  }

  async sendEmail() {
    await this.localStorage.loadSavedEmailAddresses();
    const lineBreak = '\n';

    const filePathPng = await this.fileService.getDocumentsPath(false);
    const filePathPdf = await this.fileService.getDocumentsPath(true);

    const sendTo = this.localStorage.savedEmailAddresses.join(',');

    const mailSubjectPrefix = this.translate.instant(
      'EMAIL_SERVICE_MAIL_SUBJECT_PREFIX'
    );
    const mailBodyPrefix = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PREFIX'
    );

    const mailSubject =
      mailSubjectPrefix + this.qrService.myAngularxQrCode.length;
    const mailBody =
      mailBodyPrefix + lineBreak + lineBreak + this.qrService.myAngularxQrCode;

    const attachmentPng: Attachment = {
      path: filePathPng,
      type: 'absolute',
    };

    const attachmentPdf: Attachment = {
      path: filePathPdf,
      type: 'absolute',
    };

    if (Capacitor.isNativePlatform()) {
      const available = await EmailComposer.hasAccount();
      if (available.hasAccount) {
        try {
          await EmailComposer.open({
            to: [sendTo],
            subject: mailSubject,
            body: mailBody,
            attachments: [attachmentPng, attachmentPdf],
          });

          for (const email of sendTo.split(',')) {
            await this.localStorage.saveEmail(email.trim());
          }

          this.emailSent = true;
        } catch (error) {
          console.error(error);
        }
      } else {
        console.error('Email account is not available');
      }
    } else {
      // Web: use mailto link
      const mailto = `mailto:${encodeURIComponent(
        sendTo
      )}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(
        mailBody
      )}`;
      window.location.href = mailto;
      this.displayEmailAttachmentAlert(filePathPng, filePathPdf);
    }
  }

  private displayEmailAttachmentAlert(
    filePathPng: string,
    filePathPdf: string
  ) {
    const fileNamePng = this.getFileNameFromPath(filePathPng);
    const fileNamePdf = this.getFileNameFromPath(filePathPdf);

    const header = "INFO_ALERT_TITLE_MAIL_ATTACHMENT";
    const subHeader = fileNamePng + ', ' + fileNamePdf;
    const message = "INFO_ALERT_MESSAGE_MAIL_ATTACHMENT";

    this.alertService.showInfoAlert(header, subHeader, message);
  }

  private getFileNameFromPath(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }

  clearEmailSent() {
    this.emailSent = false;
  }
}
