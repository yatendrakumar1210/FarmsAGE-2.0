const userTemplate = (name, orders) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const orderList = Array.isArray(orders) ? orders : [orders];
  const totalPaid = orderList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - FarmsAge</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
    
    <!-- Premium Emerald Header -->
    <div style="background: linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%); padding: 36px 32px; text-align: center; color: #FFFFFF;">
      <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 6px 14px; border-radius: 50px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #6EE7B7;">⚡ ORDER CONFIRMED</span>
      </div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 900; tracking: -0.5px; color: #FFFFFF;">
        Thank You for Your Order! 🎉
      </h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #D1FAE5;">
        We've received your request and our local farm partners are picking your produce fresh.
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #0F172A;">
        Hello ${name || "Valued Customer"},
      </h2>
      <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
        Your order has been successfully placed. Below are the summary details of your fresh delivery:
      </p>

      <!-- Order Details Cards -->
      ${orderList.map((order, idx) => `
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-b border-slate-200 pb-12; margin-bottom: 12px;">
            <span style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">
              Sub-Order #${idx + 1}
            </span>
            <span style="font-size: 12px; font-weight: 700; color: #64748B;">
              Status: <strong style="color: #047857;">${order.status || "Placed"}</strong>
            </span>
          </div>

          <!-- Items Table -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 10px;">
            ${(order.items || []).map(item => `
              <tr>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #1E293B;">
                  ${item.name}
                  <span style="font-size: 11px; color: #64748B; font-weight: 500;">(${item.weight || '1 kg'})</span>
                </td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748B; text-align: center;">
                  × ${item.quantity}
                </td>
                <td style="padding: 6px 0; font-size: 13px; font-weight: 800; color: #0F172A; text-align: right;">
                  ₹${item.price * item.quantity}
                </td>
              </tr>
            `).join('')}
          </table>

          <div style="border-top: 1px dashed #CBD5E1; margin-top: 12px; padding-top: 12px; font-size: 13px; color: #475569;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Payment Method:</span>
              <strong style="color: #0F172A;">${order.paymentMethod || "Online"} (${order.paymentStatus || "Paid"})</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 800; color: #065F46; font-size: 15px; margin-top: 8px;">
              <span>Sub-order Total:</span>
              <span>₹${order.totalAmount}</span>
            </div>
          </div>
        </div>
      `).join('')}

      <!-- Total Summary Banner -->
      <div style="background-color: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 28px;">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
          Total Paid Amount
        </p>
        <p style="margin: 4px 0 0; font-size: 28px; font-weight: 900; color: #047857;">
          ₹${totalPaid}
        </p>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${frontendUrl}/my-orders" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 8px 16px rgba(5, 150, 105, 0.2);">
          Track Your Delivery &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0F172A; padding: 24px 32px; text-align: center; color: #94A3B8; font-size: 12px;">
      <p style="margin: 0 0 4px; font-weight: 700; color: #E2E8F0;">FarmsAge — Hyperlocal Fresh Produce</p>
      <p style="margin: 0; color: #64748B;">Need help? Contact support directly in your app.</p>
    </div>

  </div>
</body>
</html>
  `;
};

module.exports = userTemplate;
