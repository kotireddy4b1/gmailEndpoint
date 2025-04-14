import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const event = req.body;

  const contentType = event.sys?.contentType?.sys?.id || 'unknown';
  const entryId = event.sys?.id || 'N/A';
  const action = event.sys?.type || 'N/A';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: `"Contentful Webhook" <${process.env.GMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `🔔 Contentful ${action} on ${contentType}`,
    text: `A change occurred in Contentful:\n\nAction: ${action}\nType: ${contentType}\nEntry ID: ${entryId}`
  };
  

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending email');
  }
}
