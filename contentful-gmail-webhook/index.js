const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2)); // 🔍 helpful for debugging

  const { sys, fields } = req.body;

  // Extract title from array if needed
  let titleField = 'N/A';

  if (Array.isArray(fields)) {
    const titleObj = fields.find(field => field.id === 'title');
    if (titleObj) titleField = titleObj.name || 'N/A';
  } else if (fields?.title?.['en-US']) {
    titleField = fields.title['en-US'];
  }

  const environment = sys?.environment?.sys?.id || 'N/A';
  const contentType = sys?.id || 'N/A';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Contentful Bot" <${process.env.GMAIL_USER}>`,
    to: 'kotireddyn91@gmail.com', // 📩 Set your email here
    subject: `Contentful Entry ${sys.type} Notification`,
    text: `Entry ${sys.id} was updated.\n\nTitle: ${titleField}\n\nEnvironment: ${environment}\nContent Type: ${contentType}`,
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
