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
}
