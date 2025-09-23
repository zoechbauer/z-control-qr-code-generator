import { Inject, Injectable } from '@angular/core';
import { Attachment } from 'capacitor-email-composer';
import { Capacitor } from '@capacitor/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';

import { FileUtilsService } from './file-utils.service';
import { LocalStorageService } from './local-storage.service';
import { QrUtilsService } from './qr-utils.service';
import { PrintUtilsService } from './print-utils.service';

export const EMAIL_COMPOSER = 'EMAIL_COMPOSER';

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
    private readonly localStorage: LocalStorageService,
    private readonly printUtilsService: PrintUtilsService,
    @Inject(EMAIL_COMPOSER) private readonly emailComposer: any
  ) {}

  get isEmailSent(): boolean {
    return this.emailSent;
  }

  async sendEmail() {
    await this.localStorage.loadSavedEmailAddresses();

    const sendTo = this.localStorage.savedEmailAddresses.join(',');
    const mailSubject = this.buildMailSubject();

    if (Capacitor.isNativePlatform()) {
      const mailBody = this.buildMailBodyNative();

      const attachmentPng: Attachment = {
        path: await this.fileService.getDocumentsPath(false),
        type: 'absolute',
      };
      const attachmentPdf: Attachment = {
        path: await this.fileService.getDocumentsPath(true),
        type: 'absolute',
      };

      await this.sendNativeEmail(sendTo, mailSubject, mailBody, [
        attachmentPng,
        attachmentPdf,
      ]);
    } else {
      const mailBody = this.buildMailBodyWeb();
      this.sendWebEmail(sendTo, mailSubject, mailBody);
    }

    this.clearQrCodeFileNames();
  }

  private clearQrCodeFileNames() {
    this.fileService.clearNowFormatted();
  }

  private buildMailSubject(): string {
    const prefix = this.translate.instant('EMAIL_SERVICE_MAIL_SUBJECT_PREFIX');
    const suffix = this.translate.instant('EMAIL_SERVICE_MAIL_SUBJECT_SUFFIX');
    const qrLength = this.qrService.myAngularxQrCode.length;
    const printSettings = this.printUtilsService.getConvertedPrintSettings();
    const webmail = Capacitor.isNativePlatform() ? '' : ' (Webmail)';
    return `${prefix}${qrLength}${suffix} ${printSettings}${webmail}`;
  }

  private buildMailBodyNative(): string {
    const lineBreak = '\n';
    const qrCodeValue = this.qrService.myAngularxQrCode;

    const mailBodyPrefixText = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PREFIX_TEXT'
    );
    const printingInfo1 = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_1'
    );
    const printingInfo2 = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_2'
    );
    const printingInfo3 = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_3'
    );

    const qrCodeText = qrCodeValue;
    const qrCodeTextLabel = mailBodyPrefixText;

    let mailBody = `${qrCodeTextLabel}${lineBreak}${lineBreak}${qrCodeText}${lineBreak}${lineBreak}`;
    mailBody += `${printingInfo1} ${this.printUtilsService.getConvertedPrintSettings()} ${printingInfo2}${lineBreak}${lineBreak}${printingInfo3}`;

    return mailBody;
  }

  private buildMailBodyWeb(): string {
    const lineBreak = '\n';
    const qrCodeValue = this.qrService.myAngularxQrCode;
    const maxWebLength = 400;

    const mailBodyPrefixAttachmentsWeb = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PREFIX_ATTACHEMENT_WEB'
    );
    const mailBodyPrefixText = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PREFIX_TEXT'
    );
    const mailBodyPrefixTextWeb = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PREFIX_TEXT_WEB'
    );
    const printingInfoWebMail = this.translate.instant(
      'EMAIL_SERVICE_MAIL_BODY_PRINTING_INFO_WEBMAIL'
    );

    let qrCodeText: string;
    let qrCodeTextLabel: string;

    if (qrCodeValue.length <= maxWebLength) {
      qrCodeText = qrCodeValue;
      qrCodeTextLabel = mailBodyPrefixText;
    } else {
      qrCodeText = qrCodeValue.substring(0, maxWebLength) + '...';
      qrCodeTextLabel = mailBodyPrefixTextWeb;
    }

    const attachmentLabel =
      mailBodyPrefixAttachmentsWeb +
      lineBreak +
      this.fileService.fileNamePng +
      ', ' +
      this.fileService.fileNamePdf +
      lineBreak +
      lineBreak;

    let mailBody = `${attachmentLabel}${qrCodeTextLabel}${lineBreak}${lineBreak}${qrCodeText}${lineBreak}${lineBreak}`;
    mailBody += printingInfoWebMail;

    return mailBody;
  }

  private async sendNativeEmail(
    sendTo: string,
    subject: string,
    body: string,
    attachments: Attachment[]
  ) {
    const available = await this.emailComposer.hasAccount();
    if (available.hasAccount) {
      try {
        await this.emailComposer.open({
          to: [sendTo],
          subject,
          body,
          attachments,
        });
        this.emailSent = true;
      } catch (error) {
        console.error(error);
      }
    } else {
      console.error('Email account is not available');
    }
  }

  private sendWebEmail(sendTo: string, subject: string, body: string) {
    try {
      const mailto = `mailto:${encodeURIComponent(
        sendTo
      )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        body
      )}`;

      this.navigateTo(mailto);
      this.emailSent = true;
    } catch (error) {
      console.error(error);
    }
  }

  private navigateTo(url: string) {
    window.location.href = url;
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
      this.translate.get('ERROR_ALERT_OPEN_EMAIL_BUTTON')
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
