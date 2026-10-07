const { execSync } = require('child_process');

let _cachedHost = null;

function isPrivateIpv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 169 && parts[1] === 254);
}

function detectPublicHost() {
  if (_cachedHost) return _cachedHost;

  if (process.env.MONGO_PUBLIC_HOST) {
    _cachedHost = process.env.MONGO_PUBLIC_HOST;
    return _cachedHost;
  }

  try {
    const out = execSync('curl -s --max-time 2 https://api.ipify.org 2>/dev/null', { timeout: 4000 }).toString().trim();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(out) && !isPrivateIpv4(out)) {
      _cachedHost = out;
      return _cachedHost;
    }
  } catch {}

  try {
    const out = execSync('hostname -I 2>/dev/null', { timeout: 2000 }).toString().trim();
    const ips = out.split(/\s+/).filter(ip => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && !isPrivateIpv4(ip));
    if (ips.length > 0) {
      _cachedHost = ips[0];
      return _cachedHost;
    }
  } catch {}

  _cachedHost = 'your-server-ip';
  return _cachedHost;
}

module.exports = { detectPublicHost };
