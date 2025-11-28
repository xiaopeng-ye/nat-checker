/**
 * ⚠️ BASIC NAT CLASSIFIER (USED BY BOTH BASIC AND ADVANCED DETECTION) ⚠️
 *
 * This module classifies NAT types based on IP and port mapping information.
 * It is used by both:
 * - Basic WebRTC detection (webrtc-detector.ts) - FALLBACK ONLY
 * - Advanced server-side detection (advanced-detector.ts) - PREFERRED
 *
 * For the most accurate NAT type detection, use advanced-detector.ts which
 * provides precise Full Cone, Restricted Cone, and Port-Restricted Cone classification
 * through RFC 5780 server-side tests.
 */

import { type IPAddressInfo, NATType, type PortMappingInfo } from "./types";

/**
 * Classify NAT type based on IP address information and port mapping behavior
 *
 * Classification algorithm inspired by RFC 5780 and RFC 3489, adapted for WebRTC constraints.
 *
 * ⚠️ NOTE: When used with basic WebRTC detection, this can only distinguish
 * Cone NAT (generic) vs Symmetric. For precise Cone subtypes, use advanced detection.
 *
 * **NAT Type Definitions (RFC 3489 terminology):**
 *
 * 1. **Cone NAT** (Endpoint-Independent Mapping):
 *    - Same local socket → Same external IP:port for ALL destinations
 *    - Includes: Full Cone, Restricted Cone, Port-Restricted Cone
 *    - Good for P2P: STUN/ICE hole punching usually succeeds
 *    - Browser limitation: Cannot distinguish between Cone subtypes
 *
 * 2. **Symmetric NAT** (Address/Port-Dependent Mapping):
 *    - Same local socket → Different external port PER destination
 *    - Most restrictive: Each STUN server sees different external port
 *    - Bad for P2P: Often requires TURN relay
 *
 * **Detection Method (Fixed in this version):**
 *
 * Correct Approach (Current):
 * - Single RTCPeerConnection with multiple STUN servers
 * - Same local port queries different STUN servers
 * - Port Restricted Cone: All servers see SAME external port ✅
 * - Symmetric NAT: Each server sees DIFFERENT external port ✅
 *
 * Previous Incorrect Approach (Before fix):
 * - Separate connections per STUN server (different local ports)
 * - Port Restricted Cone: Each connection got different external port ❌
 * - Incorrectly classified as Symmetric NAT ❌
 *
 * **Detection Capabilities:**
 * - ✅ Can distinguish: Symmetric NAT vs. Cone NAT (any subtype)
 * - ❌ Cannot distinguish: Full Cone vs. Restricted Cone vs. Port-Restricted Cone
 * - ❌ Cannot test: Filtering behavior (would require receiving unsolicited packets)
 * - ❌ Cannot use: RFC 5780 CHANGE-REQUEST attribute (not in WebRTC API)
 *
 * **Why We Can't Detect Cone Subtypes:**
 * - Full Cone: Requires external host to send packets without prior contact
 * - Restricted Cone: Requires testing IP-only filtering
 * - Port-Restricted: Requires testing IP+port filtering
 * - All require browser to receive unsolicited UDP (blocked by security sandbox)
 *
 * **Practical Impact:**
 * - Knowing "Cone vs. Symmetric" is sufficient for most P2P applications
 * - Cone NAT (any subtype): STUN/ICE hole punching works
 * - Symmetric NAT: Need TURN relay or advanced techniques
 *
 * @param ipInfo - IP address information from ICE candidates
 * @param portMapping - Port mapping behavior from same local port to multiple STUN servers
 * @returns Classified NAT type (CONE_NAT or SYMMETRIC)
 */
export function classifyNAT(
  ipInfo: IPAddressInfo,
  portMapping: PortMappingInfo,
): NATType {
  console.log("🔍 Classifying NAT type...", {
    isBehindLocalNAT: ipInfo.isBehindLocalNAT,
    isBehindCGNAT: ipInfo.isBehindCGNAT,
    isPortConsistent: portMapping.isPortConsistent,
    isIPConsistent: portMapping.isIPConsistent,
    observedMappings: portMapping.observedMappings.length,
  });

  // Multiple NAT layers (CGNAT + home router)
  // RFC 6598 CGNAT range: 100.64.0.0/10
  if (ipInfo.isBehindLocalNAT && ipInfo.isBehindCGNAT) {
    console.log("✅ Classified as: MULTIPLE_LAYERS (CGNAT + Local NAT)");
    return NATType.MULTIPLE_LAYERS;
  }

  // No NAT (public IP directly assigned)
  // Local IP is not in RFC 1918 private range
  if (!ipInfo.isBehindLocalNAT && !ipInfo.isBehindCGNAT) {
    console.log("✅ Classified as: NO_NAT (Direct public IP)");
    return NATType.NO_NAT;
  }

  // Symmetric NAT Detection
  // Key characteristic: Different external port for each different destination
  // Requires testing with multiple STUN servers to observe port changes
  if (!portMapping.isPortConsistent || !portMapping.isIPConsistent) {
    console.log("✅ Classified as: SYMMETRIC (Port/IP varies per destination)");
    console.log(
      "   ⚠️  P2P applications will likely fail or require TURN relay",
    );
    console.log(
      `   📊 Observed ${portMapping.observedMappings.length} different mappings`,
    );
    return NATType.SYMMETRIC;
  }

  // Cone NAT (Full/Restricted/Port-Restricted - cannot distinguish)
  // All have consistent external port mapping
  if (portMapping.isIPConsistent && portMapping.isPortConsistent) {
    console.log(
      "✅ Classified as: CONE_NAT (Consistent IP:port mapping detected)",
    );
    console.log(
      "   ℹ️  Browser Limitation: Cannot determine exact cone subtype",
    );
    console.log(
      "   ℹ️  Could be Full Cone, Restricted Cone, or Port-Restricted Cone",
    );
    console.log(
      "   ℹ️  Distinguishing requires active probing from external sources",
    );
    console.log(
      "   ℹ️  Most P2P applications work well with all Cone NAT types",
    );
    return NATType.CONE_NAT;
  }

  // Fallback (shouldn't reach here in normal operation)
  console.warn("⚠️  Unexpected mapping pattern, defaulting to SYMMETRIC");
  console.warn("   This may indicate incomplete detection or network issues");
  return NATType.SYMMETRIC;
}
