const orderStatusTemplate = (name, orderId, status) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const getStatusColor = (s) => {
    switch ((s || "").toLowerCase()) {
      case "delivered": return "#059669";
      case "out for delivery": return "#D97706";
      case "cancelled": return "#DC2626";
      default: return "#2563EB";
    }
  };

  const statusColor = getStatusColor(status);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update - FarmsAge</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #064E3B 0%, #047857 100%); padding: 36px 32px; text-align: center; color: #FFFFFF;">
      <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 6px 14px; border-radius: 50px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #6EE7B7;">🚚 DELIVERY UPDATE</span>
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #FFFFFF;">
        Order Status Update
      </h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #D1FAE5;">
        Your order status has been updated.
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px; text-align: center;">
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #0F172A;">
        Hello ${name || "Customer"},
      </h2>
      <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
        The status for your order <strong>#${orderId || ''}</strong> has changed to:
      </p>

      <!-- Status Card -->
      <div style="background-color: #F8FAFC; border: 2px solid ${statusColor}; border-radius: 18px; padding: 24px; margin-bottom: 28px;">
        <span style="display: inline-block; font-size: 18px; font-weight: 900; color: ${statusColor}; text-transform: uppercase; letter-spacing: 1px;">
          ${status || "Processing"}
        </span>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${frontendUrl}/my-orders" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 8px 16px rgba(5, 150, 105, 0.2);">
          View My Orders &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0F172A; padding: 24px 32px; text-align: center; color: #94A3B8; font-size: 12px;">
      <p style="margin: 0 0 4px; font-weight: 700; color: #E2E8F0;">FarmsAge — Fresh from farm to table</p>
      <p style="margin: 0; color: #64748B;">© ${new Date().getFullYear()} FarmsAge</p>
    </div>

  </div>
</body>
</html>
  `;
};

module.exports = orderStatusTemplate;
