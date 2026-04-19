const orderStatusTemplate = (name, orderId, status) => {
  const statusEmoji = {
    'Processing': '⚙️',
    'OutForDelivery': '🚚',
    'Delivered': '✅',
    'Cancelled': '❌'
  };

  return `
  <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial, sans-serif;">
    <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <div style="background:#16a34a;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:22px;">Order Update 🌱</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="margin-top:0;color:#111;">Hello ${name},</h2>
        <p style="font-size:15px;color:#444;line-height:1.6;">
          Your order <strong>#${orderId}</strong> status has been updated.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:20px;border-radius:10px;margin:20px 0;text-align:center;">
          <p style="margin:0;font-size:18px;color:#166534;font-weight:bold;">
            ${statusEmoji[status] || '🛎️'} ${status}
          </p>
        </div>
        <p style="font-size:14px;color:#666;">
          Check your dashboard for more details.
        </p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#888;">
        <p style="margin:0;">© ${new Date().getFullYear()} FarmsAge</p>
      </div>
    </div>
  </div>
  `;
};

module.exports = orderStatusTemplate;
