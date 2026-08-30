import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  async sendVerificationEmail(to: string, otp: string) {
    await this.transporter.sendMail({
      from: `"EduFlux" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Verify Your Eduflux Account',
      html: `<h2>Your verification code</h2><h1 style="letter-spacing:6px">${otp}</h1><p>Expires in 10 minutes.</p>`,
    });
  }

  async sendDocumentApprovedEmail(to: string, documentTitle: string) {
    await this.transporter.sendMail({
      from: `"EduFlux" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Your document has been approved',
      html: `<h2>Document approved</h2><p>Your document "${documentTitle}" has been approved and is now live.</p>`,
    });
  }

  async sendDocumentRejectedEmail(to: string, documentTitle: string) {
    await this.transporter.sendMail({
      from: `"EduFlux" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Your document needs revision',
      html: `<h2>Document update required</h2><p>Your document "${documentTitle}" was not approved. Please review the feedback and resubmit it.</p>`,
    });
  }

  async sendSubscriptionExpiringEmail(to: string, expiryDate: Date) {
    await this.transporter.sendMail({
      from: `"EduFlux" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Your EduFlux subscription is expiring soon',
      html: `<h2>Subscription expiring soon</h2><p>Your EduFlux subscription will expire on ${expiryDate.toDateString()}. Renew now to keep access to your premium content.</p>`,
    });
  }
}
