export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { variantId, finalPrice, properties } = req.body;
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
  const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

  // 🛑 THE FIX: variant_id MUST be a Number, price MUST be a String.
  const draftOrderPayload = {
    draft_order: {
      line_items: [
        {
          variant_id: parseInt(variantId, 10), // Isse Text -> Number ban jayega
          quantity: 1,
          price: finalPrice.toString(), // Isse Number -> Text ban jayega
          properties: properties
        }
      ]
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
      // Agar ab bhi fail hua, toh humein exact error dikhega
      return res.status(400).json({ error: 'Shopify Rejected', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server Error', details: error.message });
  }
}
