const userTemplate = (name, orders) => {
  return `
  <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial, sans-serif;">
    
    <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:#16a34a;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:22px;">FarmsAge 🌱</h1>
        <p style="margin:5px 0 0;font-size:13px;opacity:0.9;">
          Fresh from farms to your home
        </p>
      </div>

      <!-- Body -->
      <div style="padding:24px;">
        <h2 style="margin-top:0;color:#111;">Hello ${name}, 👋</h2>
        
        <p style="font-size:15px;color:#444;line-height:1.6;">
          Your order has been placed successfully 🎉  
          We're preparing fresh items from local vendors just for you.
        </p>

        <!-- Order Box -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:10px;margin:20px 0;">
          <p style="margin:0;font-size:14px;color:#166534;">
            🛒 <strong>Total Orders:</strong> ${orders.length}
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin:25px 0;">
          <a href="#" 
            style="background:#16a34a;color:white;padding:12px 24px;
                   text-decoration:none;border-radius:8px;font-weight:bold;
                   display:inline-block;">
            View Your Orders
          </a>
        </div>

        <p style="font-size:14px;color:#666;">
          You will receive updates when your order is shipped 🚚
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#888;">
        <p style="margin:0;">© ${new Date().getFullYear()} FarmsAge</p>
        <p style="margin:4px 0;">Empowering Local Farmers 🌾</p>
      </div>

    </div>
  </div>
  `;
};

module.exports = userTemplate;
