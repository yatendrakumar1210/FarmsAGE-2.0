const welcomeTemplate = (name) => {
  return `
  <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial, sans-serif;">
    <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <div style="background:#16a34a;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:22px;">FarmsAge 🌱</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="margin-top:0;color:#111;">Welcome to FarmsAge, ${name}! 👋</h2>
        <p style="font-size:15px;color:#444;line-height:1.6;">
          Your profile is now complete. You can now explore fresh farm-to-table products directly from local farmers and vendors.
        </p>
        <div style="text-align:center;margin:25px 0;">
          <a href="#" style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Start Shopping</a>
        </div>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#888;">
        <p style="margin:0;">© ${new Date().getFullYear()} FarmsAge</p>
      </div>
    </div>
  </div>
  `;
};

module.exports = welcomeTemplate;
