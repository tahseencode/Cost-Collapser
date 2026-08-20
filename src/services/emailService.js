import nodemailer from 'nodemailer';
import { CONFIG } from '../config.js';

export class EmailService {
  constructor() {
    this.config = {
      user: process.env.GMAIL_USER || '',
      pass: process.env.GMAIL_APP_PASSWORD || '',
      recipient: process.env.ALERT_RECIPIENT_EMAIL || '',
      enabled: true
    };
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (this.config.user && this.config.pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.config.user,
          pass: this.config.pass
        }
      });
    } else {
      this.transporter = null;
    }
  }

  updateConfig({ user, pass, recipient, enabled }) {
    if (user !== undefined) this.config.user = user.trim();
    if (pass !== undefined) this.config.pass = pass.trim();
    if (recipient !== undefined) this.config.recipient = recipient.trim();
    if (enabled !== undefined) this.config.enabled = Boolean(enabled);
    
    this.initTransporter();
    return this.getConfig();
  }

  getConfig() {
    return {
      user: this.config.user ? `${this.config.user.substring(0, 3)}***@gmail.com` : '',
      isConfigured: Boolean(this.config.user && this.config.pass),
      recipient: this.config.recipient,
      enabled: this.config.enabled
    };
  }

  /**
   * Send Real-Time Price Alert Email to Gmail
   */
  async sendPriceAlertEmail(alertData) {
    if (!this.config.enabled) return { success: false, reason: 'Email notifications disabled' };
    
    const recipient = this.config.recipient || this.config.user;
    if (!recipient) {
      return { success: false, reason: 'No recipient email configured' };
    }

    const {
      item = 'Monitored Product',
      price = 0,
      threshold = 0,
      currency = '$',
      vendor = 'Live Supplier',
      url = 'http://localhost:3000',
      summary = 'Target price threshold breached on live web target.',
      poNumber = 'N/A'
    } = alertData;

    const discountPercent = threshold > 0 ? Math.round(((threshold - price) / threshold) * 100) : 0;
    const subject = `🚨 [Price Drop Alert] ${item} dropped to ${currency}${price.toFixed(2)}!`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; margin: 0; padding: 20px; }
          .card { background-color: #131b28; border: 1px solid #233044; border-radius: 12px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #1e3a8a, #06b6d4); padding: 24px; text-align: center; }
          .title { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0; }
          .subtitle { font-size: 13px; color: #e2e8f0; margin-top: 6px; }
          .body { padding: 24px; }
          .badge { display: inline-block; background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; margin-bottom: 16px; }
          .price-box { background-color: #0b111c; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
          .price-val { font-size: 32px; font-weight: 800; color: #10b981; font-family: monospace; }
          .price-meta { font-size: 13px; color: #94a3b8; margin-top: 4px; }
          .item-name { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
          .vendor-name { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
          .summary-box { background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px; line-height: 1.5; }
          .btn-cta { display: block; background-color: #2563eb; color: #ffffff !important; text-align: center; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 20px; border-radius: 8px; margin-top: 20px; }
          .footer { padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="title">⚡ Cost Collapser Real-Time Alert</div>
            <div class="subtitle">Autonomous 0-Token Web Intelligence & Procurement</div>
          </div>
          <div class="body">
            <div class="badge">📉 PRICE TARGET BREACHED</div>
            <div class="item-name">${item}</div>
            <div class="vendor-name">Supplier: ${vendor}</div>

            <div class="price-box">
              <div class="price-val">${currency}${price.toFixed(2)}</div>
              <div class="price-meta">Alert Threshold: ${currency}${threshold.toFixed(2)} ${discountPercent > 0 ? `(${discountPercent}% Below Target)` : ''}</div>
            </div>

            <div class="summary-box">
              <strong>AI Decision Briefing:</strong><br>
              ${summary}
            </div>

            <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="color: #94a3b8; padding: 6px 0;">Polling LLM Tokens Burned:</td>
                <td style="color: #10b981; font-weight: 700; text-align: right;">0 Tokens ($0.00)</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; padding: 6px 0;">Decision Gate Status:</td>
                <td style="color: #06b6d4; font-weight: 700; text-align: right;">Awaiting Human Sign-Off</td>
              </tr>
            </table>

            <a href="http://localhost:3000" class="btn-cta">
              Open Dashboard & Approve Purchase Order →
            </a>
          </div>
          <div class="footer">
            Sent by Cost Collapser Autonomous Agent • Zero LLM Polling Costs • ${new Date().toUTCString()}
          </div>
        </div>
      </body>
      </html>
    `;

    if (!this.transporter) {
      console.log(`[EmailService - Simulated Dispatch] Recipient: ${recipient} | Subject: ${subject}`);
      return {
        success: true,
        simulated: true,
        recipient,
        subject,
        message: 'Gmail credentials not configured yet. Email logged to console in simulated mode.'
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Cost Collapser Sentinel" <${this.config.user}>`,
        to: recipient,
        subject,
        html
      });
      console.log('[EmailService] Dispatched Gmail alert:', info.messageId);
      return { success: true, messageId: info.messageId, recipient };
    } catch (err) {
      console.error('[EmailService Error]', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send Test Email to verify connection
   */
  async sendTestEmail(targetEmail) {
    const recipient = targetEmail || this.config.recipient || this.config.user;
    if (!recipient) {
      throw new Error('Please enter a recipient email address.');
    }

    if (!this.transporter) {
      return {
        success: true,
        simulated: true,
        recipient,
        message: 'Test alert recorded in Simulated Mode (add Gmail App Password to send real live emails).'
      };
    }

    const info = await this.transporter.sendMail({
      from: `"Cost Collapser" <${this.config.user}>`,
      to: recipient,
      subject: '✅ Cost Collapser Gmail Alerts Connected!',
      html: `
        <div style="font-family: sans-serif; background: #0b0f17; color: #fff; padding: 24px; border-radius: 8px;">
          <h2 style="color: #10b981;">⚡ Gmail Alerts Successfully Connected!</h2>
          <p>Your email <strong>${recipient}</strong> is now configured to receive instant real-time price drop notifications and AI procurement briefings from <strong>Cost Collapser</strong>.</p>
          <p style="color: #94a3b8; font-size: 13px;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `
    });

    return { success: true, messageId: info.messageId, recipient };
  }
}

export const emailService = new EmailService();
