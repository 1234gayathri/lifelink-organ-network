import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // This can help if there are issues with local certificate authorities
    rejectUnauthorized: false
  }
});

export const sendOtpEmail = async (to: string, otp: string, purpose: string) => {
  let subject = 'LifeLink - Login Verification Code';
  let title = 'Login Verification';
  let desc = 'Use this OTP to verify your login. If you did not request this, please ignore.';

  if (purpose === 'signup') {
    subject = 'LifeLink - Verify Your Hospital Registration';
    title = 'Verify Your Registration';
    desc = 'Please use the following OTP to complete your hospital registration.';
  } else if (purpose === 'aadhar_verify') {
    subject = 'LifeLink - Aadhar Identity Verification OTP';
    title = 'Aadhar Identity Verification';
    desc = 'Please use the following OTP to verify the donor\'s Aadhar identity for organ listing.';
  }

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">❤️ LifeLink</h1>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Organ Donation & Transplant Coordination</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 20px;">
          ${title}
        </h2>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          ${desc}
        </p>
        <div style="background: #fff; border: 2px dashed #0ea5e9; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otp}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for 5 minutes</div>
        </div>
        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; font-size: 12px; color: #92400e;">
          ⚠️ Never share this code with anyone. LifeLink staff will never ask for your OTP.
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
        This is an automated email from LifeLink. Do not reply.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"LifeLink Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendOrganInterestEmail = async (to: string, organType: string, fromHospital: string, urgency: string) => {
  const subject = `URGENT MATCH: ${organType} - Interest from ${fromHospital}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: #0ea5e9; padding: 20px; color: #fff; text-align: center;">
        <h2 style="margin: 0;">LifeLink Organ Coordination Alert</h2>
      </div>
      <div style="padding: 24px;">
        <p>A network hospital has expressed urgent interest in an organ listed by your facility.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p><strong>Organ Type:</strong> ${organType}</p>
          <p><strong>Interested Hospital:</strong> ${fromHospital}</p>
          <p><strong>Urgency Level:</strong> ${urgency}</p>
        </div>
        <p>Please log in to the LifeLink dashboard immediately to review the request and finalize coordination.</p>
        <p style="color: #64748b; font-size: 13px;">Minutes matter in organ transplant coordination. Thank you for your swift response.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"LifeLink Alerts" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

export const sendHospitalDirectEmail = async (to: string, fromHospital: string, subject: string, message: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: #0f172a; padding: 20px; color: #fff; text-align: center;">
        <h2 style="margin: 0;">LifeLink Official Communication</h2>
      </div>
      <div style="padding: 24px;">
        <p>You have received an official communication from <strong>${fromHospital}</strong> via the LifeLink Platform.</p>
        <div style="background: #f1f5f9; border-radius: 6px; padding: 20px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <p style="margin-top: 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: bold;">Message:</p>
          <div style="color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        <p style="color: #64748b; font-size: 13px;">Please log in to the platform or reply directly to start the coordination process.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${fromHospital} (LifeLink)" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[LifeLink] ${subject}`,
    html
  });
};
