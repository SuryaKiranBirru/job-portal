// Placeholder for sending emails (e.g., SendGrid, Mailgun)
async function sendEmail({ to, subject, text, html }) {
  // Integrate with email service here
  console.log(`Email sent to ${to}: ${subject}`);
}

module.exports = sendEmail; 