const vendorTemplate = (vendorName, items) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const itemList = Array.isArray(items) ? items : [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Alert - FarmsAge Vendor</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 36px 32px; text-align: center; color: #FFFFFF; border-bottom: 4px solid #10B981;">
      <div style="display: inline-block; background: rgba(16, 185, 129, 0.2); padding: 6px 14px; border-radius: 50px; margin-bottom: 12px; border: 1px solid rgba(16, 185, 129, 0.4);">
        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #34D399;">🌾 VENDOR ALERT</span>
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #FFFFFF;">
        New Order Received! 🛒
      </h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #94A3B8;">
        A customer has placed an order from your shop catalog.
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #0F172A;">
        Hello ${vendorName || "Partner Vendor"},
      </h2>
      <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
        Please pack and prepare the following produce items immediately for rapid dispatch:
      </p>

      <!-- Items Table Card -->
      <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
        <h3 style="margin: 0 0 14px; font-size: 13px; font-weight: 800; color: #065F46; text-transform: uppercase; letter-spacing: 0.5px;">
          Ordered Items List:
        </h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${itemList.map((i, idx) => `
            <tr>
              <td style="padding: 8px 0; font-size: 14px; font-weight: 700; color: #0F172A; border-bottom: ${idx === itemList.length - 1 ? 'none' : '1px solid #DCFCE7'};">
                ${i.name}
                ${i.weight ? `<span style="font-size: 12px; color: #059669; font-weight: 500;">(${i.weight})</span>` : ''}
              </td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: 900; color: #047857; text-align: right; border-bottom: ${idx === itemList.length - 1 ? 'none' : '1px solid #DCFCE7'};">
                Qty: ${i.quantity}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${frontendUrl}/vendor" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 8px 16px rgba(5, 150, 105, 0.2);">
          Open Vendor Dashboard &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0F172A; padding: 24px 32px; text-align: center; color: #94A3B8; font-size: 12px;">
      <p style="margin: 0 0 4px; font-weight: 700; color: #E2E8F0;">FarmsAge Vendor Management Network</p>
      <p style="margin: 0; color: #64748B;">Thank you for empowering local farm trade 🌾</p>
    </div>

  </div>
</body>
</html>
  `;
};

module.exports = vendorTemplate;
