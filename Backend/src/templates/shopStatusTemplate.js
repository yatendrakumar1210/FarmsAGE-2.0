const shopStatusTemplate = (name, status) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const isApproved = status === 'approved';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vendor Store Application Status - FarmsAge</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
    
    <!-- Header -->
    <div style="background: ${isApproved ? 'linear-gradient(135deg, #064E3B 0%, #047857 100%)' : 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)'}; padding: 36px 32px; text-align: center; color: #FFFFFF;">
      <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 6px 14px; border-radius: 50px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.2);">
        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: ${isApproved ? '#6EE7B7' : '#FCA5A5'};">STORE VERIFICATION</span>
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #FFFFFF;">
        Vendor Application Update 🌱
      </h1>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px; text-align: center;">
      <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #0F172A;">
        Hello ${name || "Vendor Partner"},
      </h2>
      <p style="margin: 0 0 24px; font-size: 14px; color: #475569; line-height: 1.6;">
        Your FarmsAge vendor shop registration status has been updated:
      </p>

      <!-- Status Card -->
      <div style="background-color: ${isApproved ? '#F0FDF4' : '#FEF2F2'}; border: 2px solid ${isApproved ? '#BBF7D0' : '#FECACA'}; border-radius: 18px; padding: 24px; margin-bottom: 24px;">
        <span style="display: inline-block; font-size: 20px; font-weight: 900; color: ${isApproved ? '#065F46' : '#991B1B'}; text-transform: uppercase; letter-spacing: 1px;">
          ${isApproved ? '🎉 STORE APPROVED' : '❌ APPLICATION REJECTED'}
        </span>
        <p style="margin: 10px 0 0; font-size: 13px; color: ${isApproved ? '#166534' : '#7F1D1D'}; font-weight: 500;">
          ${isApproved 
            ? 'Congratulations! You can now start adding products to your digital storefront and receiving local customer orders.' 
            : 'Unfortunately, your shop details could not be verified. You can update your business information and resubmit for review.'}
        </p>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="${frontendUrl}/vendor" style="display: inline-block; background: ${isApproved ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'}; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);">
          ${isApproved ? 'Access Vendor Portal &rarr;' : 'Review Application &rarr;'}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0F172A; padding: 24px 32px; text-align: center; color: #94A3B8; font-size: 12px;">
      <p style="margin: 0 0 4px; font-weight: 700; color: #E2E8F0;">FarmsAge Vendor Management Network</p>
      <p style="margin: 0; color: #64748B;">Empowering Local Farmers & Vendors 🌾</p>
    </div>

  </div>
</body>
</html>
  `;
};

module.exports = shopStatusTemplate;
