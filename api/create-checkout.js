export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { upgradePrice } = req.body;
    
    const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
    const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
    
    // 🛑 APNA HIDDEN PRODUCT ID YAHAN DAALEIN (Jo aapne Shopify admin se banaya)
    const UPGRADE_PRODUCT_ID = "58048354976047";
    
    const priceToSet = parseFloat(upgradePrice || 0).toFixed(2);

    // 1. Pehle check karein kya is price ka variant pehle se bana hua hai? (To keep it fast)
    const getVariants = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/products/${UPGRADE_PRODUCT_ID}/variants.json`, {
      method: 'GET',
      headers: { 'X-Shopify-Access-Token': ACCESS_TOKEN }
    });
    const existingVariants = await getVariants.json();
    
    if (existingVariants.variants) {
      const foundVariant = existingVariants.variants.find(v => parseFloat(v.price).toFixed(2) === priceToSet);
      if (foundVariant) {
        // Agar mil gaya, toh purana ID hi bhej do (Fastest)
        return res.status(200).json({ customVariantId: foundVariant.id });
      }
    }

    // 2. Agar nahi mila, toh naya variant banayein exact price ke sath
    const createVariantResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/products/${UPGRADE_PRODUCT_ID}/variants.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN
      },
      body: JSON.stringify({
        variant: {
          price: priceToSet,
          option1: `Build-${Date.now()}`, 
          inventory_policy: "continue", // Taaki stock ka issue na aaye
          requires_shipping: false
        }
      })
    });

    const variantData = await createVariantResponse.json();

    if (createVariantResponse.ok && variantData.variant) {
      return res.status(200).json({ customVariantId: variantData.variant.id });
    } else {
      return res.status(400).json({ error: 'Variant API Error', details: variantData });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server Crash', details: error.message });
  }
}
