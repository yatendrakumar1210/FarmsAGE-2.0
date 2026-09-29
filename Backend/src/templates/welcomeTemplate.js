const welcomeTemplate = (name) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FarmsAge</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
    
    <!-- Premium Dark Emerald Header -->
    <div style="background: linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%); padding: 40px 32px; text-align: center; color: #FFFFFF; position: relative;">
      <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 8px 16px; border-radius: 50px; backdrop-filter: blur(10px); margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <span style="font-size: 12px; font-weight: 800; tracking: 2px; text-transform: uppercase; letter-spacing: 1.5px; color: #6EE7B7;">🌱 FARMSAGE MARKETPLACE</span>
      </div>
      <h1 style="margin: 0; font-size: 32px; font-weight: 900; tracking: -0.5px; line-height: 1.2; font-family: 'Outfit', sans-serif;">
        Welcome to Farms<span style="color: #6EE7B7;">AGE</span>
      </h1>
      <p style="margin: 10px 0 0; font-size: 14px; color: #D1FAE5; font-weight: 500;">
        Fresh from local farms directly to your doorstep in 30-40 mins ⚡
      </p>
    </div>

    <!-- Main Content Body -->
    <div style="padding: 36px 32px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px;">
        Hello ${name || "Fresh Food Lover"} 👋
      </h2>
      <p style="margin: 0 0 24px; font-size: 15px; color: #475569; line-height: 1.7;">
        Your profile is officially set up! Welcome to India's premier hyperlocal fruits, vegetables, and organic marketplace. You're now connected directly with verified local farmers and trusted produce vendors.
      </p>

      <!-- Feature Highlight Cards -->
      <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 18px; padding: 24px; margin-bottom: 28px;">
        <h3 style="margin: 0 0 14px; font-size: 14px; font-weight: 800; color: #065F46; text-transform: uppercase; letter-spacing: 0.5px;">
          What you get with FarmsAge:
        </h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #166534; font-weight: 600;">
              🚀 <strong style="color: #065F46;">Ultra-Fast Delivery:</strong> Fresh produce delivered in under 40 minutes.
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #166534; font-weight: 600;">
              🌾 <strong style="color: #065F46;">Direct Farm Sourcing:</strong> Support local vendors & small-scale farmers.
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #166534; font-weight: 600;">
              💯 <strong style="color: #065F46;">100% Quality Guaranteed:</strong> Handpicked daily for maximum freshness.
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="${frontendUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF; padding: 16px 36px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; box-shadow: 0 10px 20px rgba(5, 150, 105, 0.25); letter-spacing: 0.2px;">
          Explore Fresh Catalog &rarr;
        </a>
      </div>
    </div>

    <!-- Modern Dark Footer -->
    <div style="background-color: #0F172A; padding: 28px 32px; text-align: center; color: #94A3B8; font-size: 12px; border-top: 1px solid #1E293B;">
      <p style="margin: 0 0 6px; font-weight: 700; color: #E2E8F0; font-size: 13px;">
        FarmsAge — Fresh from farm to table
      </p>
      <p style="margin: 0; color: #64748B;">
        © ${new Date().getFullYear()} FarmsAge. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

module.exports = welcomeTemplate;
