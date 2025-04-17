const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Parse incoming JSON from Contentful webhook
app.use(express.json({
  type: ['application/json', 'application/vnd.contentful.management.v1+json']
}));

app.post('/webhook', (req, res) => {
  const body = req.body;
  console.log('Raw Payload:', JSON.stringify(body, null, 2)); // Debug

  const { sys, fields } = body || {};

  if (!sys) {
    console.error('Missing `sys` in payload');
    return res.status(400).send('Invalid payload: Missing `sys`');
  }

  // Extract key details safely
  const entryId = sys.id || 'Unknown';
  const entryType = sys.type || 'Entry';
  const environment = sys.environment?.sys?.id || 'N/A';
  const contentType = sys.contentType?.sys?.id || 'N/A';
  const spaceId = sys.space?.sys?.id || process.env.CONTENTFUL_SPACE_ID || 'N/A';
  const title = fields?.title?.['en-US'] || 'Untitled';

  // Optional metadata
  const changedBy = sys.updatedBy?.sys?.id || sys.createdBy?.sys?.id || 'Unknown';
  const timestamp = sys.updatedAt || sys.createdAt || new Date().toISOString();
  const entryStatus = sys.publishedAt ? 'Published' : 'Draft';

  // Setup nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  // Email content
  const mailOptions = {
    from: `"Contentful Bot" <${process.env.GMAIL_USER}>`,
    to: 'kotireddyn91@gmail.com,koti.naru@gspann.com',
    subject: `🔔 Contentful ${entryType} Notification: "${title}"`,
    text: `
Hello Team,

This is an automated notification from Contentful.

An entry has been *${entryType.toUpperCase()}* in the "${environment}" environment.

----------------------------------------
📌 Entry Details:

**🔖 Title:** ${title}

**🆔 Entry ID:** ${entryId}

**🗂️ Content Type:** ${contentType}

**🧑‍💻 Changed By:** ${changedBy}

**🕒 Date/Time:** ${timestamp}

**🌐 Environment:** ${environment}

**🔧 Action:** ${entryType} (${entryStatus})
----------------------------------------

You can review the entry here:
👉 https://app.contentful.com/spaces/${spaceId}/environments/${environment}/entries/${entryId}

If this change was not expected or needs to be reviewed, please reach out to the CMS admin team.

Best regards,  
Contentful Bot 🤖
    `.trim()
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Email failed to send');
    } else {
      console.log('Email sent:', info.response);
      return res.status(200).send('Email sent successfully');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
