export default async function handler(req, res) {
  // CORS fallback inside the function
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { finalPrice, properties, title } = req.body;
    
    // Ensure numeric price string
    const numericPrice = parseFloat(finalPrice || "0.00").toFixed(2);

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
      console.error("Shopify Reject Details:", data);
      return res.status(400).json({ error: 'Shopify Rejected', details: data });
    }
  } catch (error) {
    console.error("Server Crash:", error);
    return res.status(500).json({ error: 'Server Crash', details: error.message });
  }
}
