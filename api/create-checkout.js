export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { variantId, extraPrice, properties, title } = req.body;
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
  const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

  // Item 1: Main Ring (Ye image aur base price automatic Shopify se le lega)
  let line_items = [
    {
      variant_id: variantId,
      quantity: 1,
      properties: properties
    }
  ];

  // Item 2: Agar custom diamond/metal add kiya hai, toh extra charge yahan add hoga
  if (extraPrice && parseFloat(extraPrice) > 0) {
    line_items.push({
      title: "💎 Bespoke Upgrades (Center Diamond & Metal)",
      price: extraPrice.toString(),
      quantity: 1
    });
  }

  const draftOrderPayload = {
    draft_order: {
      line_items: line_items,
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
      return res.status(400).json({ error: 'Failed', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server Error', details: error.message });
  }
}
