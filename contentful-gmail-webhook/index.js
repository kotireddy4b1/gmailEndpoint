const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

app.use(express.json({
  type: ['application/json', 'application/vnd.contentful.management.v1+json']
}));

// Optional user map
const userMap = {
  '1BHL0Z4u1bmGribCLVeYFG': 'Kotireddy Naru',
  // Add more if needed
};

function getActionLabel(sysType) {
  switch (sysType) {
    case 'Entry':
      return 'Entry Created/Updated';
    case 'DeletedEntry':
      return 'Entry Deleted';
    case 'Asset':
      return 'Asset Created/Updated';
    case 'DeletedAsset':
      return 'Asset Deleted';
    default:
      return sysType;
  }
}

app.post('/webhook', (req, res) => {
  console.log('Webhook Received:', JSON.stringify(req.body, null, 2));

  const { sys, fields } = req.body || {};

  if (!sys) {
    console.error('Missing `sys` in payload');
    return res.status(400).send('Invalid payload');
  }

  const entryId = sys.id || 'Unknown';
  const entryType = sys.type || 'Unknown';
  const title = fields?.title?.['en-US'] || 'N/A';
  const environment = sys.environment?.sys?.id || 'N/A';
  const contentType = sys.contentType?.sys?.id || 'N/A';
  const createdAt = sys.createdAt;
  const updatedAt = sys.updatedAt;
  const timestamp = updatedAt || new Date().toISOString();
  const spaceId = sys.space?.sys?.id || 'N/A';
  const updatedById = sys.updatedBy?.sys?.id || 'N/A';
  const changedBy = userMap[updatedById] || updatedById;

  let entryStatus = 'Updated';
  if (createdAt === updatedAt) {
    entryStatus = 'Created';
  }

  const actionLabel = getActionLabel(entryType);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Contentful Bot" <${process.env.GMAIL_USER}>`,
    to: 'kotireddyn91@gmail.com,koti.naru@gspann.com',
    subject: `🔔 Contentful Notification: ${actionLabel} - "${title}"`,
    html: `
      <p>Hi Team,</p>

      <p>This is an automated notification from Contentful.</p>

      <p>
        A ${actionLabel} event occurred in the "${environment}" environment.
      </p>

      <hr />

      <h3>📌 <u>Entry Details</u></h3>
      <ul>
        <li>🔖 Title: ${title}</li>
        <li>🆔 Entry ID: ${entryId}</li>
        <li>🗂️ Content Type: ${contentType}</li>
        <li>🧑‍💻 Changed By: ${changedBy}</li>
        <li>🕒 Date/Time: ${timestamp}</li>
        <li>🌐 Environment: ${environment}</li>
        <li>🔧 Action Type: ${entryType} (${entryStatus})</li>
      </ul>
      <p>
        🔗 Review Entry:<br />
        <a href="https://app.contentful.com/spaces/${spaceId}/environments/${environment}/entries/${entryId}" target="_blank">
          View Entry in Contentful
        </a>
      </p>
      <hr />
      <p>
        If this change was unexpected or requires review, please contact the CMS Admin team.
      </p>

      <p>
        Best regards,<br />
        <em>Contentful Bot 🤖</em>
      </p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Failed to send email');
    }
    console.log('Email sent:', info.response);
    res.status(200).send('Email sent successfully');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Webhook server running on port ${PORT}`));
