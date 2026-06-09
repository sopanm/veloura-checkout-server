export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { finalPrice, properties, title } = req.body;
    
    // Exact Total Price ko string mein pakad rahe hain
    const priceToUse = finalPrice || "0.00";

    const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
    const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    // 🛑 MASTER FIX: variant_id HATA DIYA! Ab Shopify base price nahi chipkayega.
    const draftOrderPayload = {
      draft_order: {
        line_items: [
          {
            title: title || "Velouraa Bespoke Ring",
            price: String(priceToUse), // Yahan aapka $1739 aayega
            quantity: 1,
            properties: properties
          }
        ]
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
      return res.status(400).json({ error: 'Shopify Rejected', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server Crash', details: error.message });
  }
}
