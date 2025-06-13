// Simple GeoIP lookup for country detection from IP address
export async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    // Remove localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return null;
    }

    // Use ip-api.com for free GeoIP lookup
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
    const data = await response.json();
    
    if (data.status === 'success' && data.country) {
      return data.country;
    }
    
    return null;
  } catch (error) {
    console.error('GeoIP lookup failed:', error);
    return null;
  }
}