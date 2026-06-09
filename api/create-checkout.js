export default async function handler(req, res) {
  // 🛑 THE FIX: Specific VIP Pass for CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  // Aapke exact store domain ko VIP pass de rahe hain
  const origin = req.headers.origin;
  if (origin === 'https://velouraagems.com' || origin === 'https://www.velouraagems.com') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Fallback
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight request ko handle karna (Bohot zaruri)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { finalPrice, properties, title } = req.body;
    
    // Price ko valid string format me badalna ("1739.00")
    const numericPrice = parseFloat(finalPrice).toFixed(2);

    const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
    const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    const draftOrderPayload = {
      draft_order: {
        line_items: [
          {
            title: title || "Velouraa Bespoke Ring",
            price: numericPrice,
            quantity: 1,
            properties: properties
          }
        ],
        use_customer_default_address: true // Shopify calculation ke liye (lekin humne variantId hata diya hai toh overwrite nahi hoga)
      }
    };

    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN
      },
      body: JSON.stringify(draftOrderPayload)
    });

    const data = await response.json();

    if (response.ok && data.draft_order) {
      return res.status(200).json({ checkoutUrl: data.draft_order.invoice_url });
    } else {
      console.error("Shopify Reject:", data);
      return res.status(400).json({ error: 'Shopify Rejected', details: data });
    }
  } catch (error) {
    console.error("Server Crash:", error);
    return res.status(500).json({ error: 'Server Crash', details: error.message });
  }
}
