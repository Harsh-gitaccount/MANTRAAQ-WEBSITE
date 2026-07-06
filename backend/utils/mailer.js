const nodemailer = require('nodemailer');

// ─── SMTP Transport ─────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection on startup (non-blocking)
transporter.verify().then(() => {
  console.log('✅ SMTP connection verified — emails are ready.');
}).catch(err => {
  console.warn('⚠️  SMTP verification failed — emails may not work:', err.message);
});

const FROM = process.env.FROM_EMAIL || 'MantraAQ <noreply@mantraaq.com>';

// ─── Shared Template Wrapper ────────────────────────────────

const wrapTemplate = (title, bodyContent) => {
  return {
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">MantraAQ</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#1f2937;font-size:20px;">${title}</h2>
          ${bodyContent}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:13px;">MantraAQ — Premium Singhara Products</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Need help? Email us at ${process.env.ADMIN_EMAIL || 'support@mantraaq.com'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: '', // Will be set per-template
  };
};

// ─── Send Mail Helper ───────────────────────────────────────

const sendMail = async (to, subject, html, text) => {
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`📧 Email sent: ${subject} → ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Email failed: ${subject} → ${to}:`, error.message);
    return null;
  }
};

// ─── Welcome Email ──────────────────────────────────────────

const sendWelcomeEmail = async (user) => {
  const template = wrapTemplate('Welcome to MantraAQ! 🎉', `
    <p style="color:#4b5563;line-height:1.6;">Hi ${user.name || 'there'},</p>
    <p style="color:#4b5563;line-height:1.6;">Welcome to <strong>MantraAQ</strong>! We're thrilled to have you join our community of health-conscious food lovers.</p>
    <p style="color:#4b5563;line-height:1.6;">Explore our premium singhara (water chestnut) products — gluten-free, diabetic-friendly, and sourced directly from Bihar farmers.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5500'}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Start Shopping →</a>
    </div>
    <p style="color:#6b7280;font-size:14px;">Use code <strong>WELCOME75</strong> for a flat <strong>₹75 discount</strong> on orders of ₹599 or above (valid on first order only)!</p>
  `);

  return sendMail(
    user.email,
    'Welcome to MantraAQ — Your Healthy Journey Starts Here! 🌿',
    template.html,
    `Welcome to MantraAQ, ${user.name || 'there'}! Start shopping at ${process.env.CLIENT_URL || 'http://localhost:5500'}. Use code WELCOME75 for flat ₹75 off on orders of ₹599 or above (valid on first order only).`
  );
};

// ─── Password Reset Email ───────────────────────────────────

const sendPasswordResetEmail = async (user, resetLink) => {
  const template = wrapTemplate('Reset Your Password', `
    <p style="color:#4b5563;line-height:1.6;">Hi ${user.name || 'there'},</p>
    <p style="color:#4b5563;line-height:1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetLink}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
    </div>
    <p style="color:#6b7280;font-size:14px;">This link will expire in <strong>1 hour</strong>.</p>
    <p style="color:#6b7280;font-size:14px;">If you didn't request this, please ignore this email. Your password won't be changed.</p>
  `);

  return sendMail(
    user.email,
    'MantraAQ — Password Reset Request',
    template.html,
    `Reset your password: ${resetLink}. This link expires in 1 hour. If you didn't request this, ignore this email.`
  );
};

// ─── Order Confirmation Email ───────────────────────────────

const sendOrderConfirmationEmail = async (order) => {
  const email = order.shippingAddress?.email;
  if (!email) return null;

  const itemsHtml = (order.orderLineItems || []).map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${item.productName || 'Product'} — ${item.variantTitle || ''}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:center;color:#374151;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;">₹${item.priceAtPurchase.toFixed(2)}</td>
    </tr>
  `).join('');

  const discountHtml = order.discountAmount > 0 ? `
    <tr><td colspan="2" style="text-align:right;padding:4px 0;color:#10b981;">Discount (${order.couponCode}):</td>
    <td style="text-align:right;padding:4px 0;color:#10b981;">-₹${order.discountAmount.toFixed(2)}</td></tr>
  ` : '';

  const template = wrapTemplate('Order Confirmed! ✅', `
    <p style="color:#4b5563;line-height:1.6;">Hi ${order.shippingAddress?.name || 'there'},</p>
    <p style="color:#4b5563;line-height:1.6;">Thank you for your order! Here's your order summary:</p>
    <p style="color:#6b7280;font-size:14px;">Order ID: <strong>${order.id.slice(0, 8).toUpperCase()}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr style="background:#f9fafb;">
        <th style="padding:10px 0;text-align:left;color:#6b7280;font-size:13px;font-weight:600;">Item</th>
        <th style="padding:10px 0;text-align:center;color:#6b7280;font-size:13px;font-weight:600;">Qty</th>
        <th style="padding:10px 0;text-align:right;color:#6b7280;font-size:13px;font-weight:600;">Price</th>
      </tr>
      ${itemsHtml}
      ${discountHtml}
      <tr><td colspan="2" style="text-align:right;padding:12px 0;font-weight:700;color:#1f2937;">Total:</td>
      <td style="text-align:right;padding:12px 0;font-weight:700;color:#10b981;font-size:18px;">₹${(order.totalAmount - (order.discountAmount || 0)).toFixed(2)}</td></tr>
    </table>
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin-top:16px;">
      <p style="margin:0;color:#166534;font-size:14px;font-weight:600;">Shipping to:</p>
      <p style="margin:4px 0 0;color:#4b5563;font-size:14px;">${order.shippingAddress?.name}, ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} — ${order.shippingAddress?.postalCode}</p>
    </div>
  `);

  return sendMail(email, `MantraAQ — Order Confirmed #${order.id.slice(0, 8).toUpperCase()}`, template.html,
    `Order confirmed! Order ID: ${order.id.slice(0, 8).toUpperCase()}. Total: ₹${(order.totalAmount - (order.discountAmount || 0)).toFixed(2)}.`
  );
};

// ─── Order Dispatched Email ─────────────────────────────────

const sendOrderDispatchedEmail = async (order) => {
  const email = order.shippingAddress?.email;
  if (!email) return null;

  const template = wrapTemplate('Your Order Has Been Shipped! 🚚', `
    <p style="color:#4b5563;line-height:1.6;">Hi ${order.shippingAddress?.name || 'there'},</p>
    <p style="color:#4b5563;line-height:1.6;">Great news! Your order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> has been dispatched and is on its way to you.</p>
    ${order.trackingNumber ? `
    <div style="background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;color:#1e40af;font-size:14px;font-weight:600;">Tracking Details:</p>
      <p style="margin:4px 0 0;color:#3b82f6;font-size:16px;font-weight:700;">${order.trackingNumber}</p>
      ${order.trackingCarrier ? `<p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Carrier: ${order.trackingCarrier}</p>` : ''}
    </div>` : ''}
    <p style="color:#6b7280;font-size:14px;">Estimated delivery: 3-5 business days.</p>
  `);

  return sendMail(email, `MantraAQ — Order Shipped #${order.id.slice(0, 8).toUpperCase()}`, template.html,
    `Your order #${order.id.slice(0, 8).toUpperCase()} has been shipped!${order.trackingNumber ? ` Tracking: ${order.trackingNumber}` : ''}`
  );
};

// ─── Delivery Confirmation Email ────────────────────────────

const sendDeliveryConfirmationEmail = async (order) => {
  const email = order.shippingAddress?.email;
  if (!email) return null;

  const template = wrapTemplate('Order Delivered! 🎉', `
    <p style="color:#4b5563;line-height:1.6;">Hi ${order.shippingAddress?.name || 'there'},</p>
    <p style="color:#4b5563;line-height:1.6;">Your order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> has been delivered successfully!</p>
    <p style="color:#4b5563;line-height:1.6;">We hope you love your MantraAQ products. If you have a moment, we'd love to hear your feedback.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5500'}#products" style="display:inline-block;background:#10b981;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Leave a Review →</a>
    </div>
  `);

  return sendMail(email, `MantraAQ — Order Delivered #${order.id.slice(0, 8).toUpperCase()}`, template.html,
    `Your order #${order.id.slice(0, 8).toUpperCase()} has been delivered! Thank you for choosing MantraAQ.`
  );
};

// ─── Order Cancellation Email ───────────────────────────────

const sendOrderCancellationEmail = async (order) => {
  const email = order.shippingAddress?.email;
  if (!email) return null;

  const template = wrapTemplate('Order Cancelled', `
    <p style="color:#4b5563;line-height:1.6;">Hi ${order.shippingAddress?.name || 'there'},</p>
    <p style="color:#4b5563;line-height:1.6;">Your order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> has been cancelled.</p>
    ${order.refundId ? `
    <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">Refund Initiated</p>
      <p style="margin:4px 0 0;color:#78350f;font-size:14px;">Refund ID: ${order.refundId}</p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Amount: ₹${(order.totalAmount - (order.discountAmount || 0)).toFixed(2)}</p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Please allow 5-7 business days for the refund to reflect.</p>
    </div>` : ''}
    <p style="color:#6b7280;font-size:14px;">If you have questions, please contact our support team.</p>
  `);

  return sendMail(email, `MantraAQ — Order Cancelled #${order.id.slice(0, 8).toUpperCase()}`, template.html,
    `Your order #${order.id.slice(0, 8).toUpperCase()} has been cancelled.${order.refundId ? ` Refund ID: ${order.refundId}` : ''}`
  );
};

// ─── Contact Form Email Helper ──────────────────────────────

const sendContactEmail = async (contactDetails) => {
  const { name, email, subject, message } = contactDetails;
  
  // 1. Email to Admin
  const adminTemplate = wrapTemplate('New Contact Message ✉️', `
    <p style="color:#4b5563;line-height:1.6;">You have received a new message from the website contact form:</p>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb;margin:16px 0;">
      <p style="margin:0 0 8px;color:#374151;"><strong>Name:</strong> ${name}</p>
      <p style="margin:0 0 8px;color:#374151;"><strong>Email:</strong> ${email}</p>
      <p style="margin:0 0 8px;color:#374151;"><strong>Subject:</strong> ${subject}</p>
      <p style="margin:0;color:#374151;white-space:pre-wrap;"><strong>Message:</strong><br/>${message}</p>
    </div>
  `);

  await sendMail(
    process.env.ADMIN_EMAIL || 'hello@mantraaq.com',
    `MantraAQ Contact Form: ${subject}`,
    adminTemplate.html,
    `New message from ${name} (${email}) - Subject: ${subject}. Message: ${message}`
  );

  // 2. Auto-responder to Customer
  const customerTemplate = wrapTemplate('Message Received! ✉️', `
    <p style="color:#4b5563;line-height:1.6;">Hi ${name || 'there'},</p>
    <p style="color:#4b5563;line-height:1.6;">Thank you for contacting <strong>MantraAQ</strong>! We have successfully received your inquiry regarding "<strong>${subject}</strong>".</p>
    <p style="color:#4b5563;line-height:1.6;">Our support team is reviewing your message and we'll get back to you within 24 hours.</p>
    <div style="background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb;margin:16px 0;font-size:14px;color:#6b7280;">
      <strong>Your Message:</strong><br/>
      ${message}
    </div>
  `);

  return sendMail(
    email,
    'MantraAQ Support — We have received your message',
    customerTemplate.html,
    `Hi ${name}, we have received your inquiry: "${subject}". We will get back to you within 24 hours.`
  );
};

// ─── Newsletter Welcome Email ───────────────────────────────

const sendNewsletterWelcomeEmail = async (email) => {
  const template = wrapTemplate('Thank you for subscribing! 🎉', `
    <p style="color:#4b5563;line-height:1.6;">Hi there,</p>
    <p style="color:#4b5563;line-height:1.6;">Thank you for subscribing to the <strong>MantraAQ newsletter</strong>! You are now part of our community dedicated to healthy, natural superfoods.</p>
    
    <!-- Coupon Code Box -->
    <div style="background:#f0fdf4;border:1px dashed #10b981;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#166534;font-size:14px;font-weight:600;">YOUR FIRST ORDER DISCOUNT CODE</p>
      <span style="display:inline-block;font-size:24px;font-weight:800;color:#059669;letter-spacing:1px;background:#fff;padding:8px 24px;border-radius:8px;border:1px solid #a7f3d0;box-shadow:0 2px 4px rgba(0,0,0,0.05);">WELCOME75</span>
      <p style="margin:8px 0 0;color:#166534;font-size:13px;">Save a flat <strong>₹75</strong> on your first order of <strong>₹299</strong> or above!</p>
    </div>

    <!-- Singhara Benefits Section -->
    <h3 style="color:#1f2937;font-size:18px;margin:24px 0 12px;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">Why Choose Singhara (Water Chestnut) Superfoods? 🌿</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#10b981;font-size:16px;">🌾</td>
        <td style="padding:8px 0 8px 8px;color:#4b5563;line-height:1.5;font-size:14px;">
          <strong>Naturally Gluten-Free:</strong> Perfect for wheat alternatives, celiacs, or clean gluten-free diets.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#10b981;font-size:16px;">🩸</td>
        <td style="padding:8px 0 8px 8px;color:#4b5563;line-height:1.5;font-size:14px;">
          <strong>Diabetic-Friendly:</strong> Has a low glycemic index and is rich in complex carbohydrates to prevent blood sugar spikes.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#10b981;font-size:16px;">💪</td>
        <td style="padding:8px 0 8px 8px;color:#4b5563;line-height:1.5;font-size:14px;">
          <strong>Nutrient Dense:</strong> Packed with essential minerals like Potassium, Manganese, Vitamin B6, and dietary fiber.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#10b981;font-size:16px;">❄️</td>
        <td style="padding:8px 0 8px 8px;color:#4b5563;line-height:1.5;font-size:14px;">
          <strong>Cold-Processed Integrity:</strong> Our grains are milled under cold processing to lock in maximum nutrition and freshness.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#10b981;font-size:16px;">🧑‍🌾</td>
        <td style="padding:8px 0 8px 8px;color:#4b5563;line-height:1.5;font-size:14px;">
          <strong>Direct Farmer Sourcing:</strong> Sourced directly from local water chestnut farmers in Bihar, securing fair trade and livelihood support.
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5500'}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(16,185,129,0.25);">Explore Singhara Superfoods →</a>
    </div>
  `);

  return sendMail(
    email,
    'Welcome to MantraAQ — Thank you for subscribing! 🌿',
    template.html,
    `Thank you for subscribing to MantraAQ! Use coupon code WELCOME75 for flat ₹75 off on orders of ₹299 or above. Discover the benefits of Singhara: naturally gluten-free, diabetic-friendly, and cold-processed. Shop now at ${process.env.CLIENT_URL || 'http://localhost:5500'}`
  );
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderDispatchedEmail,
  sendDeliveryConfirmationEmail,
  sendOrderCancellationEmail,
  sendContactEmail,
  sendNewsletterWelcomeEmail,
};
