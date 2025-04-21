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

  // Determine creation vs update
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
      <p>Hello Team,</p>
  
      <p>This is an automated notification from Contentful.</p>
  
      <p>A <strong>${actionLabel}</strong> event occurred in the "<strong>${environment}</strong>" environment.</p>
  
      <h3>📌 Entry Details:</h3>
      <ul>
        <li><strong>🔖 Title:</strong> ${title}</li>
        <li><strong>🆔 Entry ID:</strong> ${entryId}</li>
        <li><strong>🗂️ Content Type:</strong> ${contentType}</li>
        <li><strong>🧑‍💻 Changed By:</strong> ${changedBy}</li>
        <li><strong>🕒 Date/Time:</strong> ${timestamp}</li>
        <li><strong>🌐 Environment:</strong> ${environment}</li>
        <li><strong>🔧 Action Type:</strong> ${entryType} (${entryStatus})</li>
      </ul>
  
      <p><strong>🔗 Review Entry:</strong><br/>
      <a href="https://app.contentful.com/spaces/${spaceId}/environments/${environment}/entries/${entryId}">
        View Entry in Contentful
      </a></p>
  
      <p>If this change was not expected or needs review, please contact the CMS admin team.</p>
  
      <p>Best regards,<br/>
      <em>Contentful Bot 🤖</em></p>
    `
  };
  
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Webhook server running on port ${PORT}`));
