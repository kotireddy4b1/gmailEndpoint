const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Accept both standard and Contentful custom JSON content types
app.use(bodyParser.json({
  type: ['application/json', 'application/vnd.contentful.management.v1+json']
}));

app.post('/webhook', (req, res) => {
  console.log('Received webhook:', JSON.stringify(req.body, null, 2));

  const { sys, fields } = req.body || {};

  if (!sys) {
    console.error('Missing `sys` in payload');
    return res.status(400).send('Invalid payload: Missing `sys`');
  }

  const entryId = sys.id || 'Unknown';
  const entryType = sys.type || 'Entry';
  const title = fields?.title?.['en-US'] || 'N/A';
  const environment = sys.environment?.sys?.id || 'N/A';
  const contentType = sys.contentType?.sys?.id || 'N/A';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Contentful Bot" <${process.env.GMAIL_USER}>`,
    to: 'kotireddyn91@gmail.com',
    subject: `Contentful Entry ${entryType} Notification`,
    text: `Entry ${entryId} was updated.\n\nTitle: ${title}\nEnvironment: ${environment}\nContent Type: ${contentType}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Email failed to send');
    } else {
      console.log('Email sent:', info.response);
      res.status(200).send('Email sent successfully');
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
