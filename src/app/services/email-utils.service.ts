import { Injectable } from '@angular/core';
import { Attachment, EmailComposer } from 'capacitor-email-composer';
import { Capacitor } from '@capacitor/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { FileUtilsService } from './file-utils.service';
import { LocalStorageService } from './local-storage.service';
import { QrUtilsService } from './qr-utils.service';

@Injectable({
  providedIn: 'root',
})
export class EmailUtilsService {
  private emailSent = false;

  constructor(
    private readonly translate: TranslateService,
    private readonly alertController: AlertController,
    private readonly qrService: QrUtilsService,
    private readonly fileService: FileUtilsService,
    private readonly localStorage: LocalStorageService
  ) {}

  get isEmailSent(): boolean {
    return this.emailSent;
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
    const mailSubjectSuffix = this.translate.instant(
      'EMAIL_SERVICE_MAIL_SUBJECT_SUFFIX'
    );
    const mailBodyPrefix = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PREFIX'
    );
    const printingInfo = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO'
    );

    const mailSubject =
      mailSubjectPrefix +
      this.qrService.myAngularxQrCode.length +
      mailSubjectSuffix;
    const mailBody =
      mailBodyPrefix +
      lineBreak +
      lineBreak +
      this.qrService.myAngularxQrCode +
      printingInfo;

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
      let mailBodyWeb =
        this.translate.instant('EMAIL_SERVICE_MAIL_BODY_PREFIX_WEB') +
        lineBreak +
        lineBreak +
        mailBody;

      // If mailBody contains leading spaces, add info that they are not included in the mail body
      const mailBodyToUse = /^\s+/.test(this.qrService.myAngularxQrCode)
        ? mailBodyWeb
        : mailBody;
      const mailto = `mailto:${encodeURIComponent(
        sendTo
      )}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(
        mailBodyToUse
      )}`;
      window.location.href = mailto;
    }
  }

  async displayEmailAttachmentAlert(onOkCallback: () => void) {
    const fileNamePng = this.fileService.fileNamePng;
    const fileNamePdf = this.fileService.fileNamePdf;

    const header = await lastValueFrom(
      this.translate.get('INFO_ALERT_TITLE_MAIL_ATTACHMENT')
    );
    const subHeader = fileNamePng + ', ' + fileNamePdf;
    const message = await lastValueFrom(
      this.translate.get('INFO_ALERT_MESSAGE_MAIL_ATTACHMENT')
    );
    const okButton = await lastValueFrom(
      this.translate.get('ERROR_ALERT_BUTTON_OK')
    );

    const alert = await this.alertController.create({
      header,
      subHeader,
      message,
      buttons: [
        {
          text: okButton,
          handler: () => {
            try {
              onOkCallback();
            } catch (error) {
              console.error('Error in callback:', error);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  clearEmailSent() {
    this.emailSent = false;
  }
}
