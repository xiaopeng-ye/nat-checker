/** Small IPv4 helpers shared by the detector and the classifier. */

function parseIPv4(ip: string): [number, number, number, number] | null {
  const octets = ip.split(".").map(Number)
  if (octets.length !== 4) return null
  const [o0, o1, o2, o3] = octets
  if (
    o0 === undefined ||
    o1 === undefined ||
    o2 === undefined ||
    o3 === undefined
  ) {
    return null
  }
  if ([o0, o1, o2, o3].some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
    return null
  }
  return [o0, o1, o2, o3]
}

/** RFC 1918 private ranges: 10/8, 172.16/12, 192.168/16. */
export function isPrivateIP(ip: string): boolean {
  const o = parseIPv4(ip)
  if (!o) return false
  if (o[0] === 10) return true
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true
  if (o[0] === 192 && o[1] === 168) return true
  return false
}

/** RFC 6598 shared address space (carrier-grade NAT): 100.64/10. */
export function isCGNATIP(ip: string): boolean {
  const o = parseIPv4(ip)
  if (!o) return false
  return o[0] === 100 && o[1] >= 64 && o[1] <= 127
}

export function isIPv4(ip: string): boolean {
  return parseIPv4(ip) !== null
}

/** True for the mDNS names browsers use to hide local IPs ("xxxx.local"). */
export function isMDNSName(address: string): boolean {
  return address.endsWith(".local")
}
