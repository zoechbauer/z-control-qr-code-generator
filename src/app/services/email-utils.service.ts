import { Injectable } from '@angular/core';
import { Attachment, EmailComposer } from 'capacitor-email-composer';

import { FileUtilsService } from './file-utils.service';
import { LocalStorageService } from './local-storage.service';
import { QrUtilsService } from './qr-utils.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class EmailUtilsService {
  private emailSent = false;

  constructor(private fileService: FileUtilsService,
    private localStorage: LocalStorageService,
    private qrService: QrUtilsService,
    private translate: TranslateService
  ) { }

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

    const sendTo = this.localStorage.savedEmailAddresses.join(",");

    const mailSubjectPrefix = this.translate.instant('EMAIL_SERVICE_MAIL_SUBJECT_PREFIX');
    const mailBodyPrefix = this.translate.instant('EMAIL_SERVICE_MAIL_BODY_PREFIX');
    
    const mailSubject = mailSubjectPrefix + this.qrService.myAngularxQrCode.length;
    const mailBody = mailBodyPrefix + lineBreak + lineBreak + this.qrService.myAngularxQrCode;

    const attachmentPng: Attachment = {
      path: filePathPng,
      type: 'absolute',
    };

    const attachmentPdf: Attachment = {
      path: filePathPdf,
      type: 'absolute',
    };

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
  }

  clearEmailSent() {
    this.emailSent = false;
  }
}
