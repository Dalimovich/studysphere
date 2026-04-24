const https = require('https');

function stripeRequest(method, path, bodyParams, secretKey) {
  return new Promise((resolve, reject) => {
    const bodyStr = bodyParams ? bodyParams.toString() : '';
    const req = https.request({
      hostname: 'api.stripe.com',
      path,
      method,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

exports.handler = async function(event) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId   = process.env.STRIPE_PRICE_ID;
  if (!secretKey || !priceId) return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Stripe not configured' }) };

  let userId, userEmail, origin;
  try {
    const b = JSON.parse(event.body || '{}');
    userId    = b.userId;
    userEmail = b.email;
    origin    = b.origin || 'https://studybuddyai.netlify.app';
  } catch(e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid body' }) };
  }

  try {
    // URLSearchParams supports duplicate keys correctly for Stripe's array syntax
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('payment_method_types[]', 'card');
    params.append('payment_method_types[]', 'klarna');
    params.append('payment_method_types[]', 'paypal');
    params.append('success_url', origin + '?payment=success');
    params.append('cancel_url', origin + '?payment=cancelled');
    params.append('metadata[user_id]', userId || '');
    if (userEmail) params.append('customer_email', userEmail);

    const result = await stripeRequest('POST', '/v1/checkout/sessions', params, secretKey);
    if (result.status !== 200) {
      return { statusCode: result.status, headers: cors, body: JSON.stringify({ error: result.body.error?.message || 'Stripe error' }) };
    }
    return { statusCode: 200, headers: cors, body: JSON.stringify({ url: result.body.url }) };
  } catch(e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};
