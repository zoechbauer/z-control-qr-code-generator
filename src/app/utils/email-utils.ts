import { EmailComposer, Attachment } from 'capacitor-email-composer';
import { Storage } from '@ionic/storage-angular';

export async function sendEmail(
  savedEmailAddresses: string[],
  myAngularxQrCode: string,
  filePathPng: string,
  filePathPdf: string,
  storage: Storage
) {
  const lineBreak = '\n';
  const sendTo = savedEmailAddresses.join(",");
  const mailSubject = 'QR Code mit Textlänge: ' + myAngularxQrCode.length;
  const mailBody = 'Dieser Text ist im QR Code enthalten:' + lineBreak + lineBreak + myAngularxQrCode;

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
        await saveEmail(email.trim(), savedEmailAddresses, storage);
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  } else {
    console.log('Email account is not available');
    return false;
  }
}

export async function saveEmail(email: string, savedEmailAddresses: string[], storage: Storage) {
  if (email && !savedEmailAddresses.includes(email)) {
    savedEmailAddresses.push(email);
    await storage.set('savedEmailAddresses', JSON.stringify(savedEmailAddresses));
  }
}