export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { finalPrice, properties, title } = req.body;
    // Price ko ensure karein ki wo valid number ho
    const numericPrice = parseFloat(finalPrice).toFixed(2);

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify({
        draft_order: {
          line_items: [{
            title: title,
            price: numericPrice, // String format: "1739.00"
            quantity: 1,
            properties: properties
          }]
        }
      })
    });

    const data = await response.json();
    if (response.ok) {
      return res.status(200).json({ checkoutUrl: data.draft_order.invoice_url });
    } else {
      throw new Error(JSON.stringify(data));
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
