export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  },
  from: {
    email: process.env.FROM_EMAIL!,
    name: process.env.FROM_NAME || "LMS Platform",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};

if (
  !emailConfig.smtp.host ||
  !emailConfig.smtp.auth.user ||
  !emailConfig.smtp.auth.pass
) {
  throw new Error("Email configuration is incomplete");
}
