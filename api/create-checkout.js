export default async function handler(req, res) {
  // 🛑 MASTER CORS FIX: Har website se aane wali request allow karega
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Preflight check pass
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const body = req.body || {};
    const finalPrice = body.finalPrice || "0.00";
    const properties = body.properties || [];
    const title = body.title || "Velouraa Bespoke Ring";

    const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
    const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    const draftOrderPayload = {
      draft_order: {
        line_items: [
          {
            title: title,
            price: parseFloat(finalPrice).toFixed(2), // Force text format string
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
      res.status(200).json({ checkoutUrl: data.draft_order.invoice_url });
    } else {
      res.status(400).json({ error: 'Shopify Rejected', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server Crash', details: error.message });
  }
}
