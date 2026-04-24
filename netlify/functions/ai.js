const https = require('https');

// Convert Anthropic-style content to OpenAI format (string or array of blocks)
function convertContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return String(content);
  var parts = [];
  content.forEach(function(b) {
    if (b.type === 'text') {
      parts.push({ type: 'text', text: b.text || '' });
    } else if (b.type === 'image' && b.source && b.source.type === 'base64') {
      parts.push({ type: 'image_url', image_url: { url: 'data:' + b.source.media_type + ';base64,' + b.source.data } });
    }
    // skip unsupported block types (document, tool_use, etc.)
  });
  if (!parts.length) return '';
  // If only text parts, return plain string to keep it simple
  if (parts.every(function(p) { return p.type === 'text'; })) {
    return parts.map(function(p) { return p.text; }).join('\n');
  }
  return parts;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: 'OPENAI_API_KEY not set.' } })
    };
  }

  try {
    const incoming = JSON.parse(event.body || '{}');

    // Convert messages: convert Anthropic content blocks to OpenAI format
    const messages = (incoming.messages || []).map(function(m) {
      return { role: m.role, content: convertContent(m.content) };
    });

    const openaiMessages = [
      ...(incoming.system ? [{ role: 'system', content: incoming.system }] : []),
      ...messages
    ];

    const openaiBody = JSON.stringify({
      model: 'gpt-4o',
      max_completion_tokens: incoming.max_tokens || 1024,
      messages: openaiMessages
    });

    const result = await new Promise(function(resolve, reject) {
      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
          'Content-Length': Buffer.byteLength(openaiBody)
        }
      }, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() { resolve({ status: res.statusCode, body: data }); });
      });
      req.on('error', reject);
      req.write(openaiBody);
      req.end();
    });

    const oai = JSON.parse(result.body);

    // Convert OpenAI response back to Anthropic shape so app.js needs no changes
    let converted;
    if (oai.error) {
      converted = { error: oai.error };
    } else {
      const text = (oai.choices && oai.choices[0] && oai.choices[0].message)
        ? oai.choices[0].message.content
        : '';
      converted = { content: [{ type: 'text', text: text }] };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(converted)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: { message: e.message } })
    };
  }
};
