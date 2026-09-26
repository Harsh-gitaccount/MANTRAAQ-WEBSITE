const nodemailer = require('nodemailer');

// ─── SMTP Transport (fallback for local development) ────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 30000, // 30s to establish connection
  greetingTimeout: 30000,   // 30s for SMTP greeting
  socketTimeout: 60000,     // 60s for socket inactivity
});

// Brevo API Key detection (checks BREVO_API_KEY, or 'mantraaq' if named after the key)
const BREVO_KEY = process.env.BREVO_API_KEY || process.env.mantraaq || process.env.BREVO_KEY;

// Verify connection on startup (non-blocking)
if (BREVO_KEY) {
  console.log('✅ Brevo HTTP API key found - emails will be sent via Brevo REST API.');
} else {
  console.log('⚠️  No Brevo API key found - falling back to SMTP transport.');
  transporter.verify().then(() => {
    console.log('✅ SMTP connection verified - emails are ready.');
  }).catch(err => {
    console.warn('⚠️  SMTP verification failed - emails may not work:', err.message);
  });
}

const FROM = process.env.FROM_EMAIL || 'MantraAQ <hello@mantraaq.com>';

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
          <p style="margin:0;color:#9ca3af;font-size:13px;">MantraAQ - Premium Singhara Products</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">Need help? Email us at ${process.env.ADMIN_EMAIL || 'hello@mantraaq.com'}</p>
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
    const activeBrevoKey = process.env.BREVO_API_KEY || process.env.mantraaq || process.env.BREVO_KEY;

    // Primary: Use Brevo HTTP API (required on Render which blocks outbound SMTP)
    if (activeBrevoKey) {
      let senderName = 'MantraAQ';
      let senderEmail = 'hello@mantraaq.com';
      const fromMatch = FROM.match(/^(.*?)\s*<(.*?)>$/);
      if (fromMatch) {
        senderName = fromMatch[1].trim();
        senderEmail = fromMatch[2].trim();
      }

      // Format recipients array for Brevo API
      let recipients = [];
      if (Array.isArray(to)) {
        recipients = to.map(email => ({ email: email.trim() }));
      } else if (typeof to === 'string' && to.includes(',')) {
        recipients = to.split(',').map(email => ({ email: email.trim() })).filter(r => r.email);
      } else {
        recipients = [{ email: (typeof to === 'string' ? to.trim() : to) }];
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': activeBrevoKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: recipients,
          subject,
          htmlContent: html,
          textContent: text || subject
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Brevo API ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log(`📧 Email sent via Brevo API: ${subject} -> ${to} (messageId: ${result.messageId || 'N/A'})`);
      return { messageId: result.messageId };
    }

    // Fallback: Standard SMTP (for local development)
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`📧 Email sent via SMTP: ${subject} -> ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Email failed: ${subject} -> ${to}:`, error.message);
    return { error: error.message };
  }
};

// ─── Welcome Email ──────────────────────────────────────────

const sendWelcomeEmail = async (user) => {
  const template = wrapTemplate('Welcome to MantraAQ! 🎉', `
    <p style="color:#4b5563;line-height:1.6;">Hi ${user.name || 'there'},</p>
    <p style="color:#4b5563;line-height:1.6;">Welcome to <strong>MantraAQ</strong>! We're thrilled to have you join our community of health-conscious food lovers.</p>
    <p style="color:#4b5563;line-height:1.6;">Explore our premium singhara (water chestnut) products - gluten-free, diabetic-friendly, and sourced directly from Bihar farmers.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5500'}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Start Shopping →</a>
    </div>
    <p style="color:#6b7280;font-size:14px;">Use code <strong>WELCOME75</strong> for a flat <strong>₹75 discount</strong> on orders of ₹599 or above (valid on first order only)!</p>
  `);

  return sendMail(
    user.email,
    'Welcome to MantraAQ - Your Healthy Journey Starts Here! 🌿',
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
    'MantraAQ - Password Reset Request',
    template.html,
    `Reset your password: ${resetLink}. This link expires in 1 hour. If you didn't request this, ignore this email.`
  );
};

// ─── Order Confirmation Email ───────────────────────────────

const sendAdminOrderAlertEmail = async (order) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'hello@mantraaq.com,mantraaqsuperfoods@gmail.com';
  
  const itemsHtml = (order.orderLineItems || []).map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${item.productName || 'Product'} - ${item.variantTitle || ''}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:center;color:#374151;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;">₹${item.priceAtPurchase.toFixed(2)}</td>
    </tr>
  `).join('');

  const isCod = (order.paymentId?.toLowerCase().startsWith('cod') || order.shippingAddress?.paymentMethod === 'COD');

  const template = wrapTemplate('New Order Received! 🚨', `
    <p style="color:#4b5563;line-height:1.6;">Hi Admin,</p>
    <p style="color:#4b5563;line-height:1.6;">You have received a new order on MantraAQ! Here are the details:</p>
    <p style="color:#6b7280;font-size:14px;">Order ID: <strong>${order.id.toUpperCase()}</strong></p>
    <p style="color:#6b7280;font-size:14px;">Payment Method: <strong style="color: ${isCod ? '#d97706' : '#2563eb'};">${isCod ? 'Cash on Delivery (COD)' : 'Paid Online (PayU)'}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr style="background:#f9fafb;">
        <th style="padding:10px 0;text-align:left;color:#6b7280;font-size:13px;font-weight:600;">Item</th>
        <th style="padding:10px 0;text-align:center;color:#6b7280;font-size:13px;font-weight:600;">Qty</th>
        <th style="padding:10px 0;text-align:right;color:#6b7280;font-size:13px;font-weight:600;">Price</th>
      </tr>
      ${itemsHtml}
      <tr><td colspan="2" style="text-align:right;padding:12px 0;font-weight:700;color:#1f2937;">Total Amount:</td>
      <td style="text-align:right;padding:12px 0;font-weight:700;color:#10b981;font-size:18px;">₹${order.totalAmount.toFixed(2)}</td></tr>
    </table>
    <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-top:16px;border:1px solid #e2e8f0;">
      <p style="margin:0;color:#334155;font-size:14px;font-weight:600;">Shipping Address:</p>
      <p style="margin:4px 0 0;color:#475569;font-size:14px;"><strong>Name:</strong> ${order.shippingAddress?.name}</p>
      <p style="margin:2px 0 0;color:#475569;font-size:14px;"><strong>Phone:</strong> ${order.shippingAddress?.phone}</p>
      <p style="margin:2px 0 0;color:#475569;font-size:14px;"><strong>Address:</strong> ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.postalCode}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.ADMIN_URL || 'https://admin.mantraaq.com'}/orders" style="display:inline-block;background:#10b981;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Open Admin Dashboard →</a>
    </div>
  `);

  return sendMail(adminEmail, `🚨 [MantraAQ] New Order Alert #${order.id.slice(0, 8).toUpperCase()} (${isCod ? 'COD' : 'ONLINE'})`, template.html,
    `New order received! Order ID: ${order.id.slice(0, 8).toUpperCase()}. Total: ₹${order.totalAmount.toFixed(2)}. Method: ${isCod ? 'COD' : 'ONLINE'}.`
  );
};

const sendOrderConfirmationEmail = async (order) => {
  // Send admin alert notification email asynchronously
  sendAdminOrderAlertEmail(order).catch(err => 
    console.error('Admin order alert email error:', err)
  );

  const email = order.shippingAddress?.email;
  if (!email) return null;

  const isCod = (order.paymentId?.toLowerCase().startsWith('cod') || order.shippingAddress?.paymentMethod === 'COD');
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const customerName = order.shippingAddress?.name || 'Customer';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const itemsRows = (order.orderLineItems || []).map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f1f5f3;color:#1a2e22;font-size:14px;font-weight:600;">
        ${item.productName || 'Singhara Superfood'}
        <span style="display:block;font-size:12px;font-weight:400;color:#6b7c72;margin-top:2px;">
          ${item.variantTitle ? item.variantTitle + ' &bull; ' : ''}Qty: ${item.quantity}
        </span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f1f5f3;text-align:right;color:#1a2e22;font-size:14px;font-weight:600;vertical-align:top;">
        ₹${item.priceAtPurchase.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const discountRow = order.discountAmount > 0 ? `
    <tr>
      <td style="padding:6px 0;color:#059669;font-size:13px;font-weight:500;">
        Discount (${order.couponCode || 'PROMO'})
      </td>
      <td style="padding:6px 0;text-align:right;color:#059669;font-size:13px;font-weight:600;">
        -₹${order.discountAmount.toFixed(2)}
      </td>
    </tr>
  ` : '';

  const finalTotal = (order.totalAmount - (order.discountAmount || 0)).toFixed(2);

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed #${orderNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f8f6;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f8f6;padding:36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(10,30,20,0.06);border:1px solid #e7ede9;">
          
          <!-- Sleek Brand Topbar -->
          <tr>
            <td style="background-color:#0b1e14;padding:26px 32px;text-align:center;">
              <div style="font-size:20px;font-weight:800;letter-spacing:4px;color:#ffffff;text-transform:uppercase;">
                MANTRAAQ
              </div>
              <div style="font-size:10px;font-weight:600;letter-spacing:2px;color:#10b981;text-transform:uppercase;margin-top:4px;">
                Wetland Superfoods
              </div>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="padding:32px 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:20px;">
                      Order Confirmed
                    </span>
                    <h2 style="margin:12px 0 6px;color:#0b1e14;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                      Thank you, ${customerName}
                    </h2>
                    <p style="margin:0;color:#52665a;font-size:14px;line-height:1.5;">
                      Your order <strong>#${orderNumber}</strong> is confirmed. We are carefully preparing your fresh water chestnut superfoods.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Compact Tracking Notice -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8faf9;border:1px solid #e2ece6;border-radius:10px;padding:14px 16px;">
                <tr>
                  <td style="vertical-align:middle;width:24px;font-size:18px;">🚚</td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <div style="font-size:13px;color:#1a2e22;font-weight:600;line-height:1.4;">
                      Tracking ID will be shared via Email & SMS once dispatched
                    </div>
                    <div style="font-size:12px;color:#6b7c72;margin-top:2px;">
                      Estimated dispatch: 24 to 48 hrs &bull; Metro delivery: 3 to 7 business days
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items Table -->
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="border-top:1px solid #e7ede9;padding-top:16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${itemsRows}
                </table>

                <!-- Pricing Summary -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                  <tr>
                    <td style="padding:4px 0;color:#6b7c72;font-size:13px;">Subtotal</td>
                    <td style="padding:4px 0;text-align:right;color:#1a2e22;font-size:13px;font-weight:600;">₹${order.totalAmount.toFixed(2)}</td>
                  </tr>
                  ${discountRow}
                  <tr>
                    <td style="padding:4px 0;color:#6b7c72;font-size:13px;">Delivery</td>
                    <td style="padding:4px 0;text-align:right;color:#059669;font-size:13px;font-weight:600;">FREE</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0 0;color:#0b1e14;font-size:16px;font-weight:700;border-top:1px solid #e7ede9;">Total</td>
                    <td style="padding:12px 0 0;text-align:right;color:#065f46;font-size:20px;font-weight:800;border-top:1px solid #e7ede9;">₹${finalTotal}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Compact Details Grid (2 Columns: Delivery & Payment) -->
          <tr>
            <td style="padding:12px 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbfcfb;border:1px solid #e7ede9;border-radius:10px;padding:16px;">
                <tr>
                  <td style="vertical-align:top;width:60%;padding-right:12px;">
                    <div style="font-size:11px;font-weight:700;color:#6b7c72;text-transform:uppercase;letter-spacing:0.5px;">Shipping To</div>
                    <div style="font-size:13px;font-weight:600;color:#1a2e22;margin-top:4px;">${order.shippingAddress?.name}</div>
                    <div style="font-size:12px;color:#52665a;line-height:1.4;margin-top:2px;">
                      ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.postalCode}
                    </div>
                    <div style="font-size:12px;color:#52665a;margin-top:2px;">Phone: ${order.shippingAddress?.phone}</div>
                  </td>
                  <td style="vertical-align:top;width:40%;border-left:1px solid #e7ede9;padding-left:16px;">
                    <div style="font-size:11px;font-weight:700;color:#6b7c72;text-transform:uppercase;letter-spacing:0.5px;">Payment</div>
                    <div style="font-size:13px;font-weight:600;color:${isCod ? '#b45309' : '#047857'};margin-top:4px;">
                      ${isCod ? 'Cash on Delivery' : 'Paid Online'}
                    </div>
                    <div style="font-size:11px;font-weight:700;color:#6b7c72;text-transform:uppercase;letter-spacing:0.5px;margin-top:10px;">Date</div>
                    <div style="font-size:12px;color:#52665a;margin-top:2px;">${orderDate}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Elegant Minimal Footer -->
          <tr>
            <td style="background-color:#0b1e14;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#d1fae5;font-size:13px;font-weight:500;">
                Questions? We are here to help.
              </p>
              <p style="margin:6px 0 0;font-size:12px;">
                <a href="mailto:hello@mantraaq.com" style="color:#10b981;text-decoration:none;font-weight:600;">hello@mantraaq.com</a>
                <span style="color:#335342;margin:0 8px;">|</span>
                <a href="tel:+918283816755" style="color:#10b981;text-decoration:none;font-weight:600;">+91 82838 16755</a>
                <span style="color:#335342;margin:0 8px;">|</span>
                <a href="https://mantraaq.com/faq.html" style="color:#10b981;text-decoration:none;font-weight:600;">FAQ Center</a>
              </p>
              <p style="margin:16px 0 0;color:#6b7c72;font-size:11px;letter-spacing:0.5px;">
                MantraAQ &bull; Begusarai, Bihar &bull; All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendMail(
    email,
    `MantraAQ - Order Confirmed #${orderNumber}`,
    emailHtml,
    `Order confirmed! Order ID: #${orderNumber}. Total: ₹${finalTotal}. Your tracking ID will be emailed once dispatched.`
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

  return sendMail(email, `MantraAQ - Order Shipped #${order.id.slice(0, 8).toUpperCase()}`, template.html,
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

  return sendMail(email, `MantraAQ - Order Delivered #${order.id.slice(0, 8).toUpperCase()}`, template.html,
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

  return sendMail(email, `MantraAQ - Order Cancelled #${order.id.slice(0, 8).toUpperCase()}`, template.html,
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
    process.env.ADMIN_EMAIL || 'hello@mantraaq.com,mantraaqsuperfoods@gmail.com',
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
    'MantraAQ Support - We have received your message',
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

    <!-- Unsubscribe footer -->
    <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
        You received this email because you subscribed to our newsletter.<br>
        No longer want to receive these emails? 
        <a href="${process.env.CLIENT_URL || 'https://mantraaq.com'}/unsubscribe.html?email=${encodeURIComponent(email)}" style="color:#10b981;text-decoration:underline;">Unsubscribe here</a>.
      </p>
    </div>
  `);

  return sendMail(
    email,
    'Welcome to MantraAQ - Thank you for subscribing! 🌿',
    template.html,
    `Thank you for subscribing to MantraAQ! Use coupon code WELCOME75 for flat ₹75 off on orders of ₹299 or above. Discover the benefits of Singhara: naturally gluten-free, diabetic-friendly, and cold-processed. Shop now at ${process.env.CLIENT_URL || 'http://localhost:5500'}`
  );
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendAdminOrderAlertEmail,
  sendOrderDispatchedEmail,
  sendDeliveryConfirmationEmail,
  sendOrderCancellationEmail,
  sendContactEmail,
  sendNewsletterWelcomeEmail,
};
