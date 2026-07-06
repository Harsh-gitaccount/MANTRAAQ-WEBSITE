const { validationResult } = require('express-validator');
const prisma = require('../config/db');
const { sendNewsletterWelcomeEmail } = require('../utils/mailer');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email format check on the backend
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Check for duplicate subscriptions
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing && existing.isActive) {
      return res.status(400).json({ success: false, message: 'This email is already subscribed to our newsletter!' });
    }

    // Upsert: reactivate if previously unsubscribed, or create new
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalizedEmail },
      update: { isActive: true },
      create: { email: normalizedEmail, isActive: true },
    });

    // Send the automated newsletter welcome email asynchronously
    sendNewsletterWelcomeEmail(normalizedEmail).catch((err) =>
      console.error('Newsletter welcome email error:', err)
    );

    res.status(200).json({ success: true, message: 'Successfully subscribed to newsletter!' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe.' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await prisma.newsletterSubscriber.updateMany({
      where: { email: normalizedEmail },
      data: { isActive: false },
    });

    res.status(200).json({ success: true, message: 'Successfully unsubscribed.' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe.' });
  }
};

exports.adminGetSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [subscribers, totalCount] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    ]);

    res.status(200).json({ success: true, count: totalCount, subscribers });
  } catch (error) {
    console.error('Admin get subscribers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscribers.' });
  }
};
