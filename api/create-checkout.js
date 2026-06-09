export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { finalPrice, properties, title } = req.body;
    
    // Yahan log check kariye Vercel dashboard mein
    console.log("Payload:", { finalPrice, title, properties });

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify({
        draft_order: {
          line_items: [{
            title: title || "Velouraa Bespoke Ring",
            price: String(finalPrice),
            quantity: 1,
            properties: properties
          }],
          use_customer_default_address: true
        }
      })
    });

    const data = await response.json();
    console.log("Shopify Response:", JSON.stringify(data)); // 🛑 Yeh Logs mein error dikhayega

    if (response.ok) {
      return res.status(200).json({ checkoutUrl: data.draft_order.invoice_url });
    } else {
      return res.status(400).json({ error: 'Shopify Error', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server Crash', details: error.message });
  }
}
