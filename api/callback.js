export default async function handler(req, res) {
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
  const { code, shop } = req.query;

  if (!code) return res.status(400).send("Authorization Code missing from Shopify");

  try {
    const response = await fetch(`https://${shop || SHOPIFY_STORE}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code
      })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      res.send(`
        <div style="font-family: sans-serif; padding: 50px; text-align: center; background-color: #f4f6f8; height: 100vh;">
          <h1 style="color: #008060;">✅ Success! 2026 API Token Generated</h1>
          <p>Aapki Elmas app successfully connect ho gayi hai!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: inline-block; margin-top: 20px;">
            <h2 style="color: #202223; margin: 0; font-family: monospace;">${data.access_token}</h2>
          </div>
          <p style="margin-top: 20px; color: #6d7175;">Is token ko copy karke save kar lijiye.</p>
        </div>
      `);
    } else {
      res.send(`<h3>Error generating token:</h3><pre>${JSON.stringify(data, null, 2)}</pre>`);
    }
  } catch (err) {
    res.send(`Server Error: ${err.message}`);
  }
}
