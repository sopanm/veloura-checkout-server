export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { finalPrice, properties, title } = req.body;
    
    // Shopify Draft Order API requirements:
    // price must be a string, quantity must be a number
    const draftOrderPayload = {
      draft_order: {
        line_items: [
          {
            title: title || "Velouraa Bespoke Ring",
            price: parseFloat(finalPrice).toFixed(2), // Force string format like "1739.00"
            quantity: 1,
            properties: properties
          }
        ],
        use_customer_default_address: true
      }
    };

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify(draftOrderPayload)
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ checkoutUrl: data.draft_order.invoice_url });
    } else {
      console.error("Shopify Error Response:", JSON.stringify(data)); // Vercel Logs mein check karein
      return res.status(400).json({ error: 'Shopify Rejected', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server Crash', details: error.message });
  }
}
