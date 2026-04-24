const https = require('https');
const crypto = require('crypto');

function supabaseRequest(method, path, body, serviceKey, supaUrl) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const url = new URL(supaUrl);
    const req = https.request({
      hostname: url.hostname,
      path: '/rest/v1/' + path,
      method,
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(',').reduce((acc, p) => {
    const [k, v] = p.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const signed = parts.t + '.' + payload;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(parts.v1 || ''), Buffer.from(expected));
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const webhookSecret  = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceKey     = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supaUrl        = process.env.SUPABASE_URL || 'https://wprfkjeiawxlcnitsfdr.supabase.co';

  // Verify signature if webhook secret is set
  if (webhookSecret) {
    const sig = event.headers['stripe-signature'];
    try {
      if (!verifyStripeSignature(event.body, sig, webhookSecret)) {
        return { statusCode: 400, body: 'Invalid signature' };
      }
    } catch(e) {
      return { statusCode: 400, body: 'Signature error' };
    }
  }

  let evt;
  try { evt = JSON.parse(event.body); } catch(e) { return { statusCode: 400, body: 'Bad JSON' }; }

  if (evt.type === 'checkout.session.completed') {
    const session = evt.data.object;
    const userId  = session.metadata?.user_id;
    const subId   = session.subscription;
    const cusId   = session.customer;

    if (userId && serviceKey) {
      const expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseRequest('POST', 'subscriptions?on_conflict=user_id', {
        user_id: userId,
        plan: 'pro',
        status: 'active',
        stripe_subscription_id: subId || null,
        stripe_customer_id: cusId || null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, serviceKey, supaUrl);
    }
  }

  if (evt.type === 'customer.subscription.deleted') {
    const sub    = evt.data.object;
    const cusId  = sub.customer;
    if (cusId && serviceKey) {
      await supabaseRequest('PATCH', 'subscriptions?stripe_customer_id=eq.' + encodeURIComponent(cusId), {
        status: 'cancelled',
        updated_at: new Date().toISOString()
      }, serviceKey, supaUrl);
    }
  }

  return { statusCode: 200, body: 'ok' };
};
