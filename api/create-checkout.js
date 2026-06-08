export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { variantId, finalPrice, properties, title } = req.body;
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
  const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

  // Validation
  if (!finalPrice) {
    return res.status(400).json({ error: 'Failed', details: 'Price is missing' });
  }

  const draftOrderPayload = {
    draft_order: {
      line_items: [{
        variant_id: variantId, // Ye variable ID honi chahiye
        quantity: 1,
        price: finalPrice.toString(), // 🛑 FIX: Price ko String mein convert karna zaroori hai
        properties: properties,
        title: title || "Bespoke Creation"
      }],
      use_customer_default_address: true
    }
  };

  try {
    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN
      },
      body: JSON.stringify(draftOrderPayload)
    });

    const data = await response.json();

    if (data.draft_order) {
      return res.status(200).json({ checkoutUrl: data.draft_order.invoice_url });
    } else {
      // Yahan se error console mein dikhega
      return res.status(400).json({ error: 'Failed', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server Error', details: error.message });
  }
}
