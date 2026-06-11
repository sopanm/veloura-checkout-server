export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 🛑 NEW: Discount Variables Add Kiye Hain
    const { variantId, upgradePrice, properties, discountCode, discountType, discountValue } = req.body;

    const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
    const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    let draftOrderPayload = {
      draft_order: {
        line_items: [
          {
            variant_id: parseInt(variantId, 10), 
            quantity: 1,
            properties: properties 
          },
          {
            title: "💎 Bespoke Upgrades (Center Diamond & Premium Metal)", 
            price: parseFloat(upgradePrice || 0).toFixed(2), 
            quantity: 1
          }
        ]
      }
    };

    // 🛑 AGAR COUPON AAYA HAI TOH SHOPIFY KO BATAO
    if (discountCode && discountType && discountValue) {
      draftOrderPayload.draft_order.applied_discount = {
        description: discountCode,
        value_type: discountType, // 'percentage' ya 'fixed_amount'
        value: String(discountValue)
      };
    }

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
