export default async function handler(req, res) {
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN; 
  const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
  
  const REDIRECT_URI = `https://${req.headers.host}/api/auth`;
  const { code } = req.query;

  if (!code) {
    const authUrl = `https://${SHOPIFY_STORE}/admin/oauth/authorize?client_id=${CLIENT_ID}&scope=write_draft_orders,read_draft_orders&redirect_uri=${REDIRECT_URI}`;
    return res.redirect(authUrl);
  } else {
    try {
      const response = await fetch(`https://${SHOPIFY_STORE}/admin/oauth/access_token`, {
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
        return res.status(200).send(`
          <div style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>Success! Aapka API Token Mil Gaya 🎉</h1>
            <h2 style="color: #0b4a44; background: #f4f9f7; padding: 20px; border-radius: 10px;">${data.access_token}</h2>
            <p>Is code ko copy karein aur apne paas save kar lein!</p>
          </div>
        `);
      } else {
        return res.status(400).json(data);
      }
    } catch (err) {
      return res.status(500).send(err.message);
    }
  }
}
