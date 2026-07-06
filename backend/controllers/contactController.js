const { sendContactEmail } = require('../utils/mailer');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (trimmedMessage.length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters long.' });
    }

    // Call mailer helper to send emails asynchronously
    await sendContactEmail({
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully. We will get back to you within 24 hours.',
    });
  } catch (error) {
    console.error('Contact Form Submit Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your message. Please try again later.',
    });
  }
};
