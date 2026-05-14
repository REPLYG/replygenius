const https = require('https');

async function sendEmail(to, businessName) {
  const emailData = JSON.stringify({
    from: 'ReplyGenius <noreply@replygenius.fr>',
    to: [to],
    subject: '✦ Bienvenue sur ReplyGenius — Votre dashboard est prêt',
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Georgia, serif; background: #080808; color: #FAF9F6; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 0 auto; padding: 48px 32px; }
  .logo { font-size: 22px; color: #C9A84C; letter-spacing: .05em; margin-bottom: 40px; }
  .title { font-size: 32px; color: #FAF9F6; line-height: 1.2; margin-bottom: 16px; }
  .title em { color: #C9A84C; font-style: italic; }
  .text { font-size: 15px; color: #888; line-height: 1.8; margin-bottom: 24px; font-family: Arial, sans-serif; font-weight: 300; }
  .btn { display: inline-block; background: #C9A84C; color: #080808; padding: 14px 32px; font-family: Arial, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 2px; margin-bottom: 32px; }
  .steps { background: #0F0F0F; border: 1px solid rgba(201,168,76,0.15); padding: 24px; margin-bottom: 32px; }
  .step { display: flex; gap: 14px; margin-bottom: 16px; font-family: Arial, sans-serif; }
  .step-n { color: #C9A84C; font-size: 18px; font-weight: 700; flex-shrink: 0; width: 24px; }
  .step-txt { font-size: 13px; color: #888; line-height: 1.6; }
  .step-txt strong { color: #FAF9F6; }
  .footer { font-size: 12px; color: #444; font-family: Arial, sans-serif; border-top: 1px solid rgba(201,168,76,0.1); padding-top: 24px; }
</style>
</head>
<body>
<div class="container">
  <div class="logo">✦ ReplyGenius</div>
  <div class="title">Bienvenue,<br><em>${businessName}.</em></div>
  <p class="text">Votre abonnement est confirmé. Votre dashboard est prêt.</p>
  <a href="https://replygenius-xi.vercel.app/dashboard.html" class="btn">Accéder à mon dashboard</a>
  <div class="steps">
    <div class="step"><div class="step-n">01</div><div class="step-txt"><strong>Obtenez votre clé API Anthropic</strong><br>console.anthropic.com → API Keys → Create Key</div></div>
    <div class="step"><div class="step-n">02</div><div class="step-txt"><strong>Configurez votre dashboard</strong><br>Entrez votre clé API et le nom de votre établissement</div></div>
    <div class="step"><div class="step-n">03</div><div class="step-txt"><strong>L'IA répond à vos avis</strong><br>Connectez votre Google My Business et c'est parti</div></div>
  </div>
  <div class="footer"><p>© 2025 ReplyGenius · replygenius-xi.vercel.app</p></div>
</div>
</body>
</html>`
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(emailData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(emailData);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_email;
      const businessName = session.metadata?.business_name || 'votre établissement';
      if (email) await sendEmail(email, businessName);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
