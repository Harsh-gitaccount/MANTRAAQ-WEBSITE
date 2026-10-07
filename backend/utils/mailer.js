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
<body style="margin:0;padding:0;background:#f3ecdb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ecdb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:#6c1121;padding:26px 32px 22px;text-align:center;border-bottom:3px solid #c49a4f;">
          <h1 style="margin:0;color:#f3ecdb;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:5px;text-transform:uppercase;">MantraAQ</h1>
          <div style="margin-top:6px;color:#e2c27f;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">&#10070; Wetland Superfoods &#10070;</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 16px;color:#2b1a1c;font-size:20px;">${title}</h2>
          ${bodyContent}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#fbf7ee;padding:20px 32px;text-align:center;border-top:1px solid #eadfc8;">
          <p style="margin:0;color:#a8988e;font-size:13px;">MantraAQ - Premium Singhara Products</p>
          <p style="margin:4px 0 0;color:#a8988e;font-size:12px;">Need help? Email us at ${process.env.ADMIN_EMAIL || 'hello@mantraaq.com'}</p>
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
    <p style="color:#5a4a45;line-height:1.6;">Hi ${user.name || 'there'},</p>
    <p style="color:#5a4a45;line-height:1.6;">Welcome to <strong>MantraAQ</strong>! We're thrilled to have you join our community of health-conscious food lovers.</p>
    <p style="color:#5a4a45;line-height:1.6;">Explore our premium singhara (water chestnut) products - 100% naturally gluten-free, diabetic-friendly, and clean-label.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5500'}" style="display:inline-block;background:#6c1121;color:#fbf7ee;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Start Shopping →</a>
    </div>
    <p style="color:#7a6a63;font-size:14px;">Use code <strong>WELCOME75</strong> for a flat <strong>₹75 discount</strong> on orders of ₹599 or above (valid on first order only)!</p>
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
    <p style="color:#5a4a45;line-height:1.6;">Hi ${user.name || 'there'},</p>
    <p style="color:#5a4a45;line-height:1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetLink}" style="display:inline-block;background:#6c1121;color:#fbf7ee;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
    </div>
    <p style="color:#7a6a63;font-size:14px;">This link will expire in <strong>1 hour</strong>.</p>
    <p style="color:#7a6a63;font-size:14px;">If you didn't request this, please ignore this email. Your password won't be changed.</p>
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
  const adminRecipients = ['hello@mantraaq.com', 'mantraaqsuperfoods@gmail.com'];
  if (process.env.ADMIN_EMAIL) {
    process.env.ADMIN_EMAIL.split(',').forEach(e => {
      const trimmed = e.trim();
      if (trimmed && !adminRecipients.includes(trimmed)) adminRecipients.push(trimmed);
    });
  }
  
  const itemsHtml = (order.orderLineItems || []).map(item => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f5efe2;color:#3d2e2b;">${item.productName || 'Product'} - ${item.variantTitle || ''}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f5efe2;text-align:center;color:#3d2e2b;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f5efe2;text-align:right;color:#3d2e2b;">₹${item.priceAtPurchase.toFixed(2)}</td>
    </tr>
  `).join('');

  const isCod = (order.paymentId?.toLowerCase().startsWith('cod') || order.shippingAddress?.paymentMethod === 'COD');

  const template = wrapTemplate('New Order Received! 🚨', `
    <p style="color:#5a4a45;line-height:1.6;">Hi Admin,</p>
    <p style="color:#5a4a45;line-height:1.6;">You have received a new order on MantraAQ! Here are the details:</p>
    <p style="color:#7a6a63;font-size:14px;">Order ID: <strong>${order.id.toUpperCase()}</strong></p>
    <p style="color:#7a6a63;font-size:14px;">Payment Method: <strong style="color: ${isCod ? '#d97706' : '#8a6420'};">${isCod ? 'Cash on Delivery (COD)' : 'Paid Online (PayU)'}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr style="background:#fbf7ee;">
        <th style="padding:10px 0;text-align:left;color:#7a6a63;font-size:13px;font-weight:600;">Item</th>
        <th style="padding:10px 0;text-align:center;color:#7a6a63;font-size:13px;font-weight:600;">Qty</th>
        <th style="padding:10px 0;text-align:right;color:#7a6a63;font-size:13px;font-weight:600;">Price</th>
      </tr>
      ${itemsHtml}
      <tr><td colspan="2" style="text-align:right;padding:12px 0;font-weight:700;color:#2b1a1c;">Total Amount:</td>
      <td style="text-align:right;padding:12px 0;font-weight:700;color:#6c1121;font-size:18px;">₹${order.totalAmount.toFixed(2)}</td></tr>
    </table>
    <div style="background:#fbf7ee;padding:16px;border-radius:8px;margin-top:16px;border:1px solid #eadfc8;">
      <p style="margin:0;color:#3d2e2b;font-size:14px;font-weight:600;">Shipping Address:</p>
      <p style="margin:4px 0 0;color:#5a4a45;font-size:14px;"><strong>Name:</strong> ${order.shippingAddress?.name}</p>
      <p style="margin:2px 0 0;color:#5a4a45;font-size:14px;"><strong>Phone:</strong> ${order.shippingAddress?.phone}</p>
      <p style="margin:2px 0 0;color:#5a4a45;font-size:14px;"><strong>Address:</strong> ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.postalCode}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.ADMIN_URL || 'https://admin.mantraaq.com'}/orders" style="display:inline-block;background:#6c1121;color:#fbf7ee;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Open Admin Dashboard →</a>
    </div>
  `);

  return sendMail(adminRecipients, `🚨 [MantraAQ] New Order Alert #${order.id.slice(0, 8).toUpperCase()} (${isCod ? 'COD' : 'ONLINE'})`, template.html,
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
      <td style="padding:12px 0;border-bottom:1px solid #f3ecdd;color:#2b1a1c;font-size:14px;font-weight:600;">
        ${item.productName || 'Singhara Superfood'}
        <span style="display:block;font-size:12px;font-weight:400;color:#7a6a63;margin-top:2px;">
          ${item.variantTitle ? item.variantTitle + ' &bull; ' : ''}Qty: ${item.quantity}${item.quantity > 1 ? ' &times; ₹' + item.priceAtPurchase.toFixed(2) : ''}
        </span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f3ecdd;text-align:right;color:#2b1a1c;font-size:14px;font-weight:600;vertical-align:top;">
        ₹${(item.priceAtPurchase * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const discountRow = order.discountAmount > 0 ? `
    <tr>
      <td style="padding:6px 0;color:#2f4429;font-size:13px;font-weight:500;">
        Discount (${order.couponCode || 'PROMO'})
      </td>
      <td style="padding:6px 0;text-align:right;color:#2f4429;font-size:13px;font-weight:600;">
        -₹${order.discountAmount.toFixed(2)}
      </td>
    </tr>
  ` : '';

  // order.totalAmount is what the customer paid: items - discount + delivery + COD fee
  const pricing = order.shippingAddress || {};
  const itemsSubtotal = (order.orderLineItems || []).reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
  const subtotal = Number(pricing.subtotal ?? itemsSubtotal);
  const shippingCharge = Number(pricing.shippingCharge || 0);
  const codFee = Number(pricing.codFee || 0);
  const finalTotal = order.totalAmount.toFixed(2);

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed #${orderNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3ecdb;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3ecdb;padding:36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(58,10,19,0.07);border:1px solid #eadfc8;">
          
          <!-- Sleek Brand Topbar -->
          <tr>
            <td style="background-color:#6c1121;padding:26px 32px;text-align:center;border-bottom:3px solid #c49a4f;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:5px;color:#f3ecdb;text-transform:uppercase;">
                MANTRAAQ
              </div>
              <div style="font-size:10px;font-weight:600;letter-spacing:2px;color:#e2c27f;text-transform:uppercase;margin-top:4px;">
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
                    <span style="display:inline-block;background-color:#fbf5e6;border:1px solid #e9d6a8;color:#6c1121;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:20px;">
                      Order Confirmed
                    </span>
                    <h2 style="font-family:Georgia,'Times New Roman',serif;margin:12px 0 6px;color:#2a0a10;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                      Thank you, ${customerName}
                    </h2>
                    <p style="margin:0;color:#5e4e49;font-size:14px;line-height:1.5;">
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
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf7ee;border:1px solid #eadfc8;border-radius:10px;padding:14px 16px;">
                <tr>
                  <td style="vertical-align:middle;width:24px;font-size:18px;">🚚</td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <div style="font-size:13px;color:#2b1a1c;font-weight:600;line-height:1.4;">
                      Tracking ID will be shared via Email & SMS once dispatched
                    </div>
                    <div style="font-size:12px;color:#7a6a63;margin-top:2px;">
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
              <div style="border-top:1px solid #eadfc8;padding-top:16px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${itemsRows}
                </table>

                <!-- Pricing Summary -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                  <tr>
                    <td style="padding:4px 0;color:#7a6a63;font-size:13px;">Subtotal</td>
                    <td style="padding:4px 0;text-align:right;color:#2b1a1c;font-size:13px;font-weight:600;">₹${subtotal.toFixed(2)}</td>
                  </tr>
                  ${discountRow}
                  <tr>
                    <td style="padding:4px 0;color:#7a6a63;font-size:13px;">Delivery</td>
                    <td style="padding:4px 0;text-align:right;color:${shippingCharge > 0 ? '#2b1a1c' : '#2f4429'};font-size:13px;font-weight:600;">${shippingCharge > 0 ? '₹' + shippingCharge.toFixed(2) : 'FREE'}</td>
                  </tr>
                  ${codFee > 0 ? `
                  <tr>
                    <td style="padding:4px 0;color:#7a6a63;font-size:13px;">Cash on Delivery fee</td>
                    <td style="padding:4px 0;text-align:right;color:#2b1a1c;font-size:13px;font-weight:600;">₹${codFee.toFixed(2)}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:12px 0 0;color:#2a0a10;font-size:16px;font-weight:700;border-top:1px solid #eadfc8;">Total</td>
                    <td style="padding:12px 0 0;text-align:right;color:#6c1121;font-size:20px;font-weight:800;border-top:1px solid #eadfc8;">₹${finalTotal}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Compact Details Grid (2 Columns: Delivery & Payment) -->
          <tr>
            <td style="padding:12px 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdfaf3;border:1px solid #eadfc8;border-radius:10px;padding:16px;">
                <tr>
                  <td style="vertical-align:top;width:60%;padding-right:12px;">
                    <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.5px;">Shipping To</div>
                    <div style="font-size:13px;font-weight:600;color:#2b1a1c;margin-top:4px;">${order.shippingAddress?.name}</div>
                    <div style="font-size:12px;color:#5e4e49;line-height:1.4;margin-top:2px;">
                      ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.postalCode}
                    </div>
                    <div style="font-size:12px;color:#5e4e49;margin-top:2px;">Phone: ${order.shippingAddress?.phone}</div>
                  </td>
                  <td style="vertical-align:top;width:40%;border-left:1px solid #eadfc8;padding-left:16px;">
                    <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.5px;">Payment</div>
                    <div style="font-size:13px;font-weight:600;color:${isCod ? '#b45309' : '#2f4429'};margin-top:4px;">
                      ${isCod ? 'Cash on Delivery' : 'Paid Online'}
                    </div>
                    <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.5px;margin-top:10px;">Date</div>
                    <div style="font-size:12px;color:#5e4e49;margin-top:2px;">${orderDate}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Elegant Minimal Footer -->
          <tr>
            <td style="background-color:#3a0a13;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#f3e8cc;font-size:13px;font-weight:500;">
                Questions? We are here to help.
              </p>
              <p style="margin:6px 0 0;font-size:12px;">
                <a href="mailto:hello@mantraaq.com" style="color:#e2c27f;text-decoration:none;font-weight:600;">hello@mantraaq.com</a>
                <span style="color:#4a3a36;margin:0 8px;">|</span>
                <a href="tel:+918283816755" style="color:#e2c27f;text-decoration:none;font-weight:600;">+91 82838 16755</a>
                <span style="color:#4a3a36;margin:0 8px;">|</span>
                <a href="https://mantraaq.com/faq.html" style="color:#e2c27f;text-decoration:none;font-weight:600;">FAQ Center</a>
              </p>
              <p style="margin:16px 0 0;color:#7a6a63;font-size:11px;letter-spacing:0.5px;">
                MantraAQ &bull; All rights reserved
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

// ─── Carrier Tracking Helpers ───────────────────────────────

const getCarrierTrackingUrl = (carrier, trackingNumber, customUrl) => {
  if (customUrl && typeof customUrl === 'string') {
    let trimmed = customUrl.trim();
    if (trimmed.length > 0) {
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = 'https://' + trimmed;
      }
      return trimmed;
    }
  }
  const cleanAwb = encodeURIComponent((trackingNumber || '').trim());
  const c = (carrier || '').toLowerCase();

  if (c.includes('bluedart') || c.includes('blue dart')) {
    return `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${cleanAwb}`;
  }
  if (c.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${cleanAwb}`;
  }
  if (c.includes('dtdc')) {
    return `https://www.dtdc.in/tracking.asp`;
  }
  if (c.includes('post') || c.includes('speed post')) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
  }
  if (c.includes('shiprocket')) {
    return `https://shiprocket.co/tracking/${cleanAwb}`;
  }
  if (c.includes('shadowfax')) {
    return `https://tracker.shadowfax.in/#/track/${cleanAwb}`;
  }
  return `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${cleanAwb}`;
};

const getCarrierPortalUrl = (carrier) => {
  const c = (carrier || '').toLowerCase();
  if (c.includes('bluedart') || c.includes('blue dart')) return 'https://www.bluedart.com/tracking';
  if (c.includes('delhivery')) return 'https://www.delhivery.com';
  if (c.includes('dtdc')) return 'https://www.dtdc.in';
  if (c.includes('post') || c.includes('speed post')) return 'https://www.indiapost.gov.in';
  if (c.includes('shiprocket')) return 'https://shiprocket.co';
  if (c.includes('shadowfax')) return 'https://shadowfax.in';
  return 'https://www.bluedart.com/tracking';
};

const getTrackingLabel = (carrier) => {
  const c = (carrier || '').toLowerCase();
  if (c.includes('bluedart') || c.includes('blue dart')) {
    return 'Waybill Number';
  }
  if (c.includes('dtdc') || c.includes('post') || c.includes('speed post')) {
    return 'Consignment Number';
  }
  return 'Waybill / Tracking Number';
};

// ─── Order Dispatched Email ─────────────────────────────────

const sendOrderDispatchedEmail = async (order, customTrackingUrl) => {
  const email = order.shippingAddress?.email;
  if (!email) return null;

  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const customerName = order.shippingAddress?.name || 'Customer';
  const carrier = order.trackingCarrier || 'Blue Dart Express';
  const trackingNumber = order.trackingNumber || 'Available on request';
  const trackingLabel = getTrackingLabel(carrier);
  const trackingUrl = getCarrierTrackingUrl(carrier, trackingNumber, customTrackingUrl);
  const portalUrl = getCarrierPortalUrl(carrier);

  const itemsRows = (order.orderLineItems || []).map(item => {
    const pName = item.productName || item.variant?.product?.name || 'Singhara Superfood';
    const vTitle = item.variantTitle || item.variant?.title || '';
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3ecdd;color:#2b1a1c;font-size:13px;font-weight:600;">
          ${pName}
          <span style="display:block;font-size:11px;font-weight:400;color:#7a6a63;margin-top:2px;">
            ${vTitle ? vTitle + ' &bull; ' : ''}Qty: ${item.quantity}${item.quantity > 1 ? ' &times; ₹' + item.priceAtPurchase.toFixed(2) : ''}
          </span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f3ecdd;text-align:right;color:#2b1a1c;font-size:13px;font-weight:600;vertical-align:top;">
          ₹${(item.priceAtPurchase * item.quantity).toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Been Dispatched - MantraAQ</title>
</head>
<body style="margin:0;padding:0;background-color:#f3ecdb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2b1a1c;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3ecdb;padding:30px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eadfc8;box-shadow:0 6px 24px rgba(58,10,19,0.07);">
          
          <!-- Compact Luxury Header -->
          <tr>
            <td style="background-color:#6c1121;padding:26px 32px;text-align:center;border-bottom:3px solid #c49a4f;">
              <h1 style="margin:0;color:#f3ecdb;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:5px;text-transform:uppercase;">MANTRAAQ</h1>
              <div style="color:#e2c27f;font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;margin-top:4px;">
                ANCIENT SUPERFOODS &bull; CLEAN NUTRITION
              </div>
            </td>
          </tr>

          <!-- Dispatch Announcement Banner -->
          <tr>
            <td style="padding:32px 32px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:#fbf5e6;border:1px solid #e9d6a8;color:#6c1121;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:20px;">
                      Order Dispatched
                    </span>
                    <h2 style="font-family:Georgia,'Times New Roman',serif;margin:12px 0 6px;color:#2a0a10;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                      Your Order Is On Its Way, ${customerName}
                    </h2>
                    <p style="margin:0;color:#5e4e49;font-size:14px;line-height:1.5;">
                      Your order <strong>#${orderNumber}</strong> has been hand-packed with care and handed over to our courier partner for delivery.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Courier & Tracking Card -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf7ee;border:1px solid #e4d7bd;border-radius:12px;padding:20px 22px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.8px;">
                      Courier Partner
                    </div>
                    <div style="font-size:16px;font-weight:700;color:#2a0a10;margin-top:4px;">
                      ${carrier}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;">
                    <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.8px;">
                      ${trackingLabel}
                    </div>
                    <div style="display:inline-block;background-color:#ffffff;border:1px solid #d9cbb0;padding:8px 14px;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:17px;font-weight:700;color:#2f4429;letter-spacing:1px;margin-top:6px;">
                      ${trackingNumber}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;">
                    <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;background-color:#6c1121;color:#fbf7ee;padding:13px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 3px 8px rgba(108,17,33,0.22);">
                      Track Your Shipment &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;">
                    <p style="margin:0;font-size:12px;color:#5e4e49;line-height:1.5;">
                      <strong>How to track:</strong> Click the button above to view live transit updates, or visit <a href="${portalUrl}" target="_blank" rel="noopener noreferrer" style="color:#2f4429;text-decoration:underline;font-weight:600;">${carrier}</a> and enter your ${trackingLabel.toLowerCase()} <strong>${trackingNumber}</strong>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items in this Shipment -->
          ${itemsRows ? `
          <tr>
            <td style="padding:0 32px 18px;">
              <div style="border-top:1px solid #eadfc8;padding-top:16px;">
                <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
                  Items In This Shipment
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${itemsRows}
                </table>
              </div>
            </td>
          </tr>` : ''}

          <!-- Delivery Destination Details -->
          <tr>
            <td style="padding:0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdfaf3;border:1px solid #eadfc8;border-radius:10px;padding:16px;">
                <tr>
                  <td style="vertical-align:top;">
                    <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.5px;">Shipping Destination</div>
                    <div style="font-size:13px;font-weight:600;color:#2b1a1c;margin-top:4px;">${order.shippingAddress?.name}</div>
                    <div style="font-size:12px;color:#5e4e49;line-height:1.4;margin-top:2px;">
                      ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.postalCode}
                    </div>
                    ${order.shippingAddress?.phone ? `<div style="font-size:12px;color:#5e4e49;margin-top:2px;">Phone: ${order.shippingAddress?.phone}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Elegant Minimal Footer -->
          <tr>
            <td style="background-color:#3a0a13;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#f3e8cc;font-size:13px;font-weight:500;">
                Questions about your delivery? We are here to help.
              </p>
              <p style="margin:6px 0 0;font-size:12px;">
                <a href="mailto:hello@mantraaq.com" style="color:#e2c27f;text-decoration:none;font-weight:600;">hello@mantraaq.com</a>
                <span style="color:#4a3a36;margin:0 8px;">|</span>
                <a href="tel:+918283816755" style="color:#e2c27f;text-decoration:none;font-weight:600;">+91 82838 16755</a>
                <span style="color:#4a3a36;margin:0 8px;">|</span>
                <a href="https://mantraaq.com/faq.html" style="color:#e2c27f;text-decoration:none;font-weight:600;">FAQ Center</a>
              </p>
              <p style="margin:16px 0 0;color:#7a6a63;font-size:11px;letter-spacing:0.5px;">
                MantraAQ &bull; All rights reserved
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
    `MantraAQ - Order Shipped #${orderNumber} via ${carrier}`,
    emailHtml,
    `Your order #${orderNumber} has been dispatched via ${carrier}. ${trackingLabel}: ${trackingNumber}. Track your shipment: ${trackingUrl}`
  );
};

// ─── Delivery Confirmation Email ────────────────────────────

const sendDeliveryConfirmationEmail = async (order) => {
  const email = order.shippingAddress?.email;
  if (!email) return null;

  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const customerName = order.shippingAddress?.name || 'Customer';

  const itemsRows = (order.orderLineItems || []).map(item => {
    const pName = item.productName || item.variant?.product?.name || 'Singhara Superfood';
    const vTitle = item.variantTitle || item.variant?.title || '';
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3ecdd;color:#2b1a1c;font-size:13px;font-weight:600;">
          ${pName}
          <span style="display:block;font-size:11px;font-weight:400;color:#7a6a63;margin-top:2px;">
            ${vTitle ? vTitle + ' &bull; ' : ''}Qty: ${item.quantity}${item.quantity > 1 ? ' &times; ₹' + item.priceAtPurchase.toFixed(2) : ''}
          </span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f3ecdd;text-align:right;color:#2b1a1c;font-size:13px;font-weight:600;vertical-align:top;">
          ₹${(item.priceAtPurchase * item.quantity).toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Been Delivered - MantraAQ</title>
</head>
<body style="margin:0;padding:0;background-color:#f3ecdb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2b1a1c;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3ecdb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eadfc8;box-shadow:0 6px 24px rgba(58,10,19,0.07);">
          
          <!-- Compact Luxury Header -->
          <tr>
            <td style="background-color:#6c1121;padding:26px 32px;text-align:center;border-bottom:3px solid #c49a4f;">
              <h1 style="margin:0;color:#f3ecdb;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:5px;text-transform:uppercase;">MANTRAAQ</h1>
              <div style="color:#e2c27f;font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;margin-top:4px;">
                ANCIENT SUPERFOODS &bull; CLEAN NUTRITION
              </div>
            </td>
          </tr>

          <!-- Delivery Announcement Hero -->
          <tr>
            <td style="padding:32px 32px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:#fbf5e6;border:1px solid #e2c27f;color:#2f4429;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:20px;">
                      Delivered Successfully
                    </span>
                    <h2 style="font-family:Georgia,'Times New Roman',serif;margin:14px 0 6px;color:#2a0a10;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                      Your Order Has Arrived, ${customerName}
                    </h2>
                    <p style="margin:0;color:#5e4e49;font-size:14px;line-height:1.5;">
                      Your package for order <strong>#${orderNumber}</strong> has been safely delivered to your doorstep. We are truly delighted to bring pure, unadulterated plant superfoods into your home.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sincere Gratitude Card (Fact-Based) -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf7ee;border:1px solid #eadfc8;border-radius:12px;padding:20px;">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:700;color:#6c1121;letter-spacing:0.3px;margin-bottom:6px;">
                      Thank You for Choosing Clean, Honest Nutrition 🌿
                    </div>
                    <p style="margin:0;color:#574843;font-size:13px;line-height:1.6;">
                      Thank you for trusting MantraAQ for your daily wellness. Every product we craft is made from 100% pure water chestnut: cold-processed, stone-ground, and prepared with zero maida, zero palm oil, and zero preservatives. We appreciate your partnership in making clean whole-food nutrition a daily standard.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivered Items Summary -->
          ${itemsRows ? `
          <tr>
            <td style="padding:0 32px 20px;">
              <div style="border-top:1px solid #eadfc8;padding-top:16px;">
                <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
                  Items In This Delivery
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${itemsRows}
                </table>
              </div>
            </td>
          </tr>` : ''}

          <!-- The Science of Water Chestnut (3 Factual Pillars) -->
          <tr>
            <td style="padding:0 32px 22px;">
              <div style="background-color:#ffffff;border:1px solid #eadfc8;border-radius:12px;padding:18px 20px;">
                <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;">
                  The MantraAQ Nutritional Standard
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:10px;vertical-align:top;width:24px;font-size:16px;">🌾</td>
                    <td style="padding-bottom:10px;padding-left:10px;vertical-align:top;">
                      <div style="font-size:13px;font-weight:700;color:#2b1a1c;">100% Naturally Gluten-Free</div>
                      <div style="font-size:12px;color:#5e4e49;line-height:1.4;margin-top:2px;">
                        Derived entirely from the aquatic water chestnut fruit. Zero wheat, zero grain cross-contamination.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:10px;vertical-align:top;width:24px;font-size:16px;">⚡</td>
                    <td style="padding-bottom:10px;padding-left:10px;vertical-align:top;">
                      <div style="font-size:13px;font-weight:700;color:#2b1a1c;">Low Glycemic & Potassium-Rich</div>
                      <div style="font-size:12px;color:#5e4e49;line-height:1.4;margin-top:2px;">
                        Provides steady, sustained energy without blood sugar spikes, while supporting healthy digestion and gut wellness.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align:top;width:24px;font-size:16px;">🍃</td>
                    <td style="padding-left:10px;vertical-align:top;">
                      <div style="font-size:13px;font-weight:700;color:#2b1a1c;">Cold-Processed Purity</div>
                      <div style="font-size:12px;color:#5e4e49;line-height:1.4;margin-top:2px;">
                        Stone-ground under low temperatures to preserve natural antioxidants, dietary fiber, and authentic earthy aroma.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Explore Next: The Full Superfood Range (Repeat Order Motivation) -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdfaf3;border:1px solid #e4d7bd;border-radius:12px;padding:22px 20px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#2f4429;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                      Complete Your Healthy Kitchen
                    </div>
                    <h3 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 8px;color:#2a0a10;font-size:17px;font-weight:700;">
                      Bring Whole-Food Nutrition to Every Meal
                    </h3>
                    <p style="margin:0 0 16px;color:#5e4e49;font-size:13px;line-height:1.5;">
                      Loved this order? Discover how easy it is to replace refined grains throughout your week:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <tr>
                        <td style="font-size:12px;color:#3d2e2b;padding:3px 0;">&bull; <strong>Singhara Atta:</strong> For soft gluten-free rotis, puris, and vrat recipes</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#3d2e2b;padding:3px 0;">&bull; <strong>Singhara Pasta & Vermicelli:</strong> High-fiber, al dente comfort food</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#3d2e2b;padding:3px 0;">&bull; <strong>Singhara Roasted Snacks:</strong> Light, crunchy snacking with zero palm oil</td>
                      </tr>
                    </table>
                    <a href="${process.env.CLIENT_URL || 'https://mantraaq.com'}#products" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;background-color:#6c1121;color:#fbf7ee;padding:13px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.5px;box-shadow:0 3px 8px rgba(108,17,33,0.22);">
                      Explore The Full Superfood Collection &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Culinary & Storage Tips -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf7ee;border:1px solid #eadfc8;border-radius:10px;padding:16px 18px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#7a6a63;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
                      Culinary & Storage Recommendations
                    </div>
                    <div style="font-size:12px;color:#574843;line-height:1.6;">
                      &bull; <strong>Storage:</strong> Transfer into an airtight glass or food-grade container in a cool, dry place away from heat and direct sunlight.<br>
                      &bull; <strong>Dough Preparation:</strong> For the softest Singhara rotis, knead the flour using warm water with a drop of cold-pressed oil.<br>
                      &bull; <strong>Pasta Cooking:</strong> Boil in generously salted water for 4 to 5 minutes until tender yet firm to the bite.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Founder Care & Feedback -->
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <p style="margin:0;color:#2b1a1c;font-size:13px;font-weight:600;">
                How was your unboxing experience?
              </p>
              <p style="margin:6px 0 0;color:#7a6a63;font-size:12px;line-height:1.5;">
                We love hearing how our superfoods fit into your routine.<br>
                Reply directly to this email or connect with us on WhatsApp at <strong>+91 82838 16755</strong>.
              </p>
            </td>
          </tr>

          <!-- Elegant Minimal Footer -->
          <tr>
            <td style="background-color:#3a0a13;padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#f3e8cc;font-size:13px;font-weight:500;">
                MantraAQ &bull; Pure Water Chestnut Superfoods
              </p>
              <p style="margin:6px 0 0;font-size:12px;">
                <a href="mailto:hello@mantraaq.com" style="color:#e2c27f;text-decoration:none;font-weight:600;">hello@mantraaq.com</a>
                <span style="color:#4a3a36;margin:0 8px;">|</span>
                <a href="tel:+918283816755" style="color:#e2c27f;text-decoration:none;font-weight:600;">+91 82838 16755</a>
                <span style="color:#4a3a36;margin:0 8px;">|</span>
                <a href="https://mantraaq.com/faq.html" style="color:#e2c27f;text-decoration:none;font-weight:600;">FAQ Center</a>
              </p>
              <p style="margin:16px 0 0;color:#7a6a63;font-size:11px;letter-spacing:0.5px;">
                MantraAQ &bull; All rights reserved
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
    `MantraAQ - Your Order Has Arrived #${orderNumber}`,
    emailHtml,
    `Your order #${orderNumber} has been delivered successfully! Thank you for choosing clean water chestnut superfoods with MantraAQ. Explore our full superfood range at ${process.env.CLIENT_URL || 'https://mantraaq.com'}#products`
  );
};

// ─── Order Cancellation Email ───────────────────────────────

const sendOrderCancellationEmail = async (order) => {
  const email = order.shippingAddress?.email;
  if (!email) return null;

  const template = wrapTemplate('Order Cancelled', `
    <p style="color:#5a4a45;line-height:1.6;">Hi ${order.shippingAddress?.name || 'there'},</p>
    <p style="color:#5a4a45;line-height:1.6;">Your order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> has been cancelled.</p>
    ${order.refundId ? `
    <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">Refund Initiated</p>
      <p style="margin:4px 0 0;color:#78350f;font-size:14px;">Refund ID: ${order.refundId}</p>
      <p style="margin:4px 0 0;color:#7a6a63;font-size:13px;">Amount: ₹${order.totalAmount.toFixed(2)}</p>
      <p style="margin:4px 0 0;color:#7a6a63;font-size:13px;">Please allow 5-7 business days for the refund to reflect.</p>
    </div>` : ''}
    <p style="color:#7a6a63;font-size:14px;">If you have questions, please contact our support team.</p>
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
    <p style="color:#5a4a45;line-height:1.6;">You have received a new message from the website contact form:</p>
    <div style="background:#fbf7ee;padding:16px;border-radius:8px;border:1px solid #eadfc8;margin:16px 0;">
      <p style="margin:0 0 8px;color:#3d2e2b;"><strong>Name:</strong> ${name}</p>
      <p style="margin:0 0 8px;color:#3d2e2b;"><strong>Email:</strong> ${email}</p>
      <p style="margin:0 0 8px;color:#3d2e2b;"><strong>Subject:</strong> ${subject}</p>
      <p style="margin:0;color:#3d2e2b;white-space:pre-wrap;"><strong>Message:</strong><br/>${message}</p>
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
    <p style="color:#5a4a45;line-height:1.6;">Hi ${name || 'there'},</p>
    <p style="color:#5a4a45;line-height:1.6;">Thank you for contacting <strong>MantraAQ</strong>! We have successfully received your inquiry regarding "<strong>${subject}</strong>".</p>
    <p style="color:#5a4a45;line-height:1.6;">Our support team is reviewing your message and we'll get back to you within 24 hours.</p>
    <div style="background:#fbf7ee;padding:16px;border-radius:8px;border:1px solid #eadfc8;margin:16px 0;font-size:14px;color:#7a6a63;">
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
    <p style="color:#5a4a45;line-height:1.6;">Hi there,</p>
    <p style="color:#5a4a45;line-height:1.6;">Thank you for subscribing to the <strong>MantraAQ newsletter</strong>! You are now part of our community dedicated to healthy, natural superfoods.</p>
    
    <!-- Coupon Code Box -->
    <div style="background:#fbf5e6;border:1px dashed #c49a4f;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#2f4429;font-size:14px;font-weight:600;">YOUR FIRST ORDER DISCOUNT CODE</p>
      <span style="display:inline-block;font-size:24px;font-weight:800;color:#2f4429;letter-spacing:1px;background:#fff;padding:8px 24px;border-radius:8px;border:1px solid #e2c27f;box-shadow:0 2px 4px rgba(0,0,0,0.05);">WELCOME75</span>
      <p style="margin:8px 0 0;color:#2f4429;font-size:13px;">Save a flat <strong>₹75</strong> on your first order of <strong>₹599</strong> or above!</p>
    </div>

    <!-- Singhara Benefits Section -->
    <h3 style="font-family:Georgia,'Times New Roman',serif;color:#2b1a1c;font-size:18px;margin:24px 0 12px;border-bottom:2px solid #f5efe2;padding-bottom:6px;">Why Choose Singhara (Water Chestnut) Superfoods? 🌿</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#6c1121;font-size:16px;">🌾</td>
        <td style="padding:8px 0 8px 8px;color:#5a4a45;line-height:1.5;font-size:14px;">
          <strong>Naturally Gluten-Free:</strong> Perfect for wheat alternatives, celiacs, or clean gluten-free diets.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#6c1121;font-size:16px;">🩸</td>
        <td style="padding:8px 0 8px 8px;color:#5a4a45;line-height:1.5;font-size:14px;">
          <strong>Diabetic-Friendly:</strong> Has a low glycemic index and is rich in complex carbohydrates to prevent blood sugar spikes.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#6c1121;font-size:16px;">💪</td>
        <td style="padding:8px 0 8px 8px;color:#5a4a45;line-height:1.5;font-size:14px;">
          <strong>Nutrient Dense:</strong> Packed with essential minerals like Potassium, Manganese, Vitamin B6, and dietary fiber.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#6c1121;font-size:16px;">❄️</td>
        <td style="padding:8px 0 8px 8px;color:#5a4a45;line-height:1.5;font-size:14px;">
          <strong>Cold-Processed Integrity:</strong> Our grains are milled under cold processing to lock in maximum nutrition and freshness.
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;color:#6c1121;font-size:16px;">🧑‍🌾</td>
        <td style="padding:8px 0 8px 8px;color:#5a4a45;line-height:1.5;font-size:14px;">
          <strong>Direct Farmer Sourcing:</strong> Sourced responsibly from native water chestnut wetlands, securing fair trade and livelihood support.
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5500'}" style="display:inline-block;background:#6c1121;color:#fbf7ee;padding:12px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(108,17,33,0.22);">Explore Singhara Superfoods →</a>
    </div>

    <!-- Unsubscribe footer -->
    <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #eadfc8;">
      <p style="margin:0;color:#a8988e;font-size:12px;line-height:1.5;">
        You received this email because you subscribed to our newsletter.<br>
        No longer want to receive these emails? 
        <a href="${process.env.CLIENT_URL || 'https://mantraaq.com'}/unsubscribe.html?email=${encodeURIComponent(email)}" style="color:#6c1121;text-decoration:underline;">Unsubscribe here</a>.
      </p>
    </div>
  `);

  return sendMail(
    email,
    'Welcome to MantraAQ - Thank you for subscribing! 🌿',
    template.html,
    `Thank you for subscribing to MantraAQ! Use coupon code WELCOME75 for flat ₹75 off on your first order of ₹599 or above. Discover the benefits of Singhara: naturally gluten-free, diabetic-friendly, and cold-processed. Shop now at ${process.env.CLIENT_URL || 'http://localhost:5500'}`
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
