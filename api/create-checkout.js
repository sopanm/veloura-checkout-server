export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { variantId, upgradePrice, properties } = req.body;

    const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
    const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    // 🛑 MASTER FIX: 1 Item for Photo, 1 Item for Custom Price Balance
    const draftOrderPayload = {
      draft_order: {
        line_items: [
          {
            variant_id: parseInt(variantId, 10), // 👉 Isse RING KI PHOTO aayegi!
            quantity: 1,
            properties: properties // Saari details photo ke niche dikhengi
          },
          {
            title: "💎 Bespoke Upgrades (Center Diamond & Premium Metal)", 
            price: parseFloat(upgradePrice || 0).toFixed(2), // 👉 Isse baaki price add hogi
            quantity: 1
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
      console.error("Shopify Reject:", data);
      return res.status(400).json({ error: 'Shopify Rejected', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server Crash', details: error.message });
  }
}
