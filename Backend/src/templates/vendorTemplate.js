const vendorTemplate = (vendorName, items) => {
  return `
  <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial, sans-serif;">
    
    <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:#16a34a;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:22px;">FarmsAge Vendor Panel 🌱</h1>
        <p style="margin:5px 0 0;font-size:13px;opacity:0.9;">
          New Order Notification
        </p>
      </div>

      <!-- Body -->
      <div style="padding:24px;">
        <h2 style="margin-top:0;color:#111;">Hello ${vendorName}, 👋</h2>
        
        <p style="font-size:15px;color:#444;line-height:1.6;">
          You’ve received a new order 🛒 from a customer.  
          Please prepare the items for delivery.
        </p>

        <!-- Order Items Box -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:10px;margin:20px 0;">
          <p style="margin:0 0 10px;font-size:14px;color:#166534;">
            <strong>Order Items:</strong>
          </p>
          <ul style="padding-left:18px;margin:0;color:#166534;font-size:14px;">
            ${items
              .map(
                (i) =>
                  `<li style="margin-bottom:6px;">${i.name} × ${i.quantity}</li>`,
              )
              .join("")}
          </ul>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin:25px 0;">
          <a href="#" 
            style="background:#16a34a;color:white;padding:12px 24px;
                   text-decoration:none;border-radius:8px;font-weight:bold;
                   display:inline-block;">
            View Order Details
          </a>
        </div>

        <p style="font-size:14px;color:#666;">
          Please process the order as soon as possible for fast delivery 🚚
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#888;">
        <p style="margin:0;">© ${new Date().getFullYear()} FarmsAge</p>
        <p style="margin:4px 0;">Supporting Local Vendors & Farmers 🌾</p>
      </div>

    </div>
  </div>
  `;
};

module.exports = vendorTemplate;
