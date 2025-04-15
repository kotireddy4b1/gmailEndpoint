const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  const { sys, fields } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  // ✅ Email options defined properly
  const mailOptions = {
    from: `"Contentful Bot" <${process.env.GMAIL_USER}>`,
    to: 'kotireddyn91@gmail.com', // <-- Replace this with your target user's email
    subject: `Contentful Entry ${sys.type} Notification`,
    text: `Entry ${sys.id} was updated.\n\nTitle: ${fields?.title?.['en-US'] || 'N/A'}\n\nEnvironment: ${sys.environment?.id || 'N/A'}\nContent Type: ${sys.contentType?.sys?.id || 'N/A'}`
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
