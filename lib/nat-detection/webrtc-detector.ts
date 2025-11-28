/**
 * ⚠️ BASIC DETECTION MODULE (FALLBACK ONLY) ⚠️
 *
 * This module provides basic client-side NAT detection using WebRTC.
 * It is used as a FALLBACK when advanced server-side detection is not available.
 *
 * CURRENT USAGE:
 * - Backup method when advanced detection API is unreachable
 * - Used internally by advanced-detector.ts to gather basic IP/port info
 *
 * LIMITATIONS:
 * - Cannot distinguish Full Cone, Restricted Cone, Port-Restricted Cone
 * - Lower accuracy compared to RFC 5780 server-side detection
 * - Browser WebRTC API does not expose CHANGE-REQUEST attribute
 *
 * PREFERRED METHOD: See lib/nat-detection/advanced-detector.ts
 */

import { STUN_SERVERS } from "./stun-servers";
import {
  type IPAddressInfo,
  isCGNATIP,
  isPrivateIP,
  type PortMappingInfo,
} from "./types";

/**
 * Extended RTCIceCandidate interface to handle non-standard browser properties
 * Some browsers expose 'ip' as a direct property (non-standard)
 * Note: RTCIceCandidate already has 'address' and 'port' properties
 */
interface ExtendedRTCIceCandidate extends RTCIceCandidate {
  ip: string | null;
}

/**
 * WebRTC NAT Detection Algorithm (Basic Client-Side Detection)
 *
 * This module implements RFC 5780 (NAT Behavior Discovery Using STUN) methodology
 * to classify Network Address Translation (NAT) types using browser WebRTC APIs.
 *
 * ⚠️ NOTE: This is the BASIC detection method. For more accurate results,
 * use the advanced server-side detection (advanced-detector.ts).
 *
 * Algorithm Overview:
 * 1. Create RTCPeerConnection with STUN server configuration
 * 2. Trigger ICE candidate gathering by creating a data channel and offer
 * 3. Collect ICE candidates (host, srflx, relay types)
 * 4. Analyze IP addresses and port mappings to determine NAT type
 * 5. Classify based on RFC 5780 criteria
 *
 * Key Concepts:
 * - Host Candidate: Local IP address (behind NAT if RFC 1918 private)
 * - Server-Reflexive (srflx) Candidate: External IP/port as seen by STUN server
 * - Port Mapping Consistency: Whether external port stays the same across bindings
 * - IP Consistency: Whether external IP stays the same across bindings
 *
 * Privacy: All detection happens client-side. No data sent to backend servers.
 */

const TOTAL_TIMEOUT = 15000; // 15 seconds maximum for entire detection process

/**
 * Extract IP address from ICE candidate string
 *
 * ICE candidates are returned in SDP format:
 * "candidate:<foundation> <component> <protocol> <priority> <IP> <port> typ <type> ..."
 *
 * Example: "candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host"
 *
 * @param candidate - RTCIceCandidate object from WebRTC
 * @returns Extracted IP address or null if parsing fails
 */
function extractIPFromCandidate(candidate: RTCIceCandidate): string | null {
  try {
    // Parse the candidate string (SDP format)
    const candidateStr = candidate.candidate;
    if (!candidateStr) return null;

    // Candidate format: "candidate:<foundation> <component> <protocol> <priority> <IP> <port> typ <type> ..."
    const parts = candidateStr.split(" ");
    if (parts.length < 5) return null;

    const ip = parts[4]; // IP is at index 4

    // Validate IP format (basic check)
    if (ip?.match(/^[\d.]+$/)) {
      return ip;
    }

    // Also try the address/ip property as fallback (non-standard browser extensions)
    const extCandidate = candidate as ExtendedRTCIceCandidate;
    return extCandidate.address || extCandidate.ip || null;
  } catch (_e) {
    const extCandidate = candidate as ExtendedRTCIceCandidate;
    return extCandidate.address || extCandidate.ip || null;
  }
}

/**
 * Extract IP address information from ICE candidates
 *
 * This function analyzes the collected ICE candidates to determine:
 * 1. Local IP address (from host candidate)
 * 2. Public IP address (from server-reflexive candidate)
 * 3. NAT presence (comparing local vs. public IPs)
 * 4. CGNAT detection (checking if public IP is in RFC 6598 range)
 *
 * NAT Detection Logic:
 * - If local IP is private (RFC 1918) → Behind home router NAT
 * - If public IP is CGNAT range (100.64.0.0/10) → Behind carrier-grade NAT
 * - If both → Multiple NAT layers (double NAT)
 *
 * mDNS Privacy:
 * Modern browsers may obfuscate local IPs with mDNS names (*.local)
 * for privacy. We handle this by assuming mDNS = private IP.
 *
 * @param candidates - Array of ICE candidates from WebRTC
 * @returns IP address information with NAT detection flags
 * @throws Error if no host candidate found
 */
export function extractIPInfo(candidates: RTCIceCandidate[]): IPAddressInfo {
  const hostCandidate = candidates.find((c) => c.type === "host");
  const srflxCandidate = candidates.find((c) => c.type === "srflx");

  if (!hostCandidate) {
    throw new Error("No host candidate found");
  }

  // Try to extract real IP from candidate string first, fall back to address property
  const extHostCandidate = hostCandidate as ExtendedRTCIceCandidate;
  const localIP =
    extractIPFromCandidate(hostCandidate) ||
    extHostCandidate.address ||
    extHostCandidate.ip ||
    "";

  const publicIP = srflxCandidate
    ? (() => {
        const extSrflxCandidate = srflxCandidate as ExtendedRTCIceCandidate;
        return (
          extractIPFromCandidate(srflxCandidate) ||
          extSrflxCandidate.address ||
          extSrflxCandidate.ip ||
          null
        );
      })()
    : null;

  const publicPort = srflxCandidate?.port || null;

  // If localIP ends with .local, it's mDNS obfuscation - mark it as such
  const isMDNS = localIP.endsWith(".local");

  // For mDNS addresses, we can't determine if it's private, so we assume it is
  // since mDNS is only used when the real IP would be private
  const isBehindLocalNAT = isMDNS || isPrivateIP(localIP);
  const isBehindCGNAT = publicIP ? isCGNATIP(publicIP) : false;

  return {
    localIP,
    publicIP,
    publicPort,
    isBehindLocalNAT,
    isBehindCGNAT,
  };
}

/**
 * Analyze port mapping behavior from ICE candidates
 *
 * This function examines how the NAT device maps internal ports to external ports:
 *
 * Port Mapping Types:
 * - Consistent Port: External port stays the same across bindings (Full Cone NAT)
 * - Inconsistent Port: Different external port per binding (Port-Restricted/Symmetric)
 *
 * IP Mapping Types:
 * - Consistent IP: External IP stays the same (most NAT types)
 * - Inconsistent IP: Different external IP per binding (Symmetric NAT)
 *
 * This analysis is used by nat-classifier.ts to determine the final NAT type.
 *
 * @param candidates - Array of ICE candidates from WebRTC
 * @returns Port and IP mapping consistency information
 */
export function analyzePortMapping(
  candidates: RTCIceCandidate[],
): PortMappingInfo {
  const srflxCandidates = candidates.filter((c) => c.type === "srflx");

  // Extract and validate mappings, filtering out invalid entries
  const mappings = srflxCandidates
    .map((c) => {
      const extCandidate = c as ExtendedRTCIceCandidate;
      const ip = extCandidate.address || extCandidate.ip;
      const port = c.port;

      // Filter out invalid data to prevent false positives
      // Empty IP or port 0 indicates incomplete/failed candidate
      if (!ip || !port) {
        console.warn("⚠️ Skipping invalid srflx candidate:", {
          hasIP: !!ip,
          port,
        });
        return null;
      }

      return { ip, port };
    })
    .filter((m): m is { ip: string; port: number } => m !== null);

  // If no valid mappings, return conservative values (inconsistent)
  // This prevents false positive Full Cone detection
  if (mappings.length === 0) {
    console.warn("⚠️ No valid srflx mappings found");
    return {
      isPortConsistent: false,
      isIPConsistent: false,
      observedMappings: [],
    };
  }

  const uniqueIPs = new Set(mappings.map((m) => m.ip));
  const uniquePorts = new Set(mappings.map((m) => m.port));

  console.log(`📊 Port Mapping Analysis:`);
  console.log(`   Total srflx candidates: ${mappings.length}`);
  console.log(`   Unique external IPs: ${uniqueIPs.size}`);
  console.log(`   Unique external ports: ${uniquePorts.size}`);

  // Log all unique mappings for debugging
  const uniqueMappings = Array.from(
    new Set(mappings.map((m) => `${m.ip}:${m.port}`)),
  );
  console.log(`   External mappings observed:`);
  uniqueMappings.forEach((mapping, i) => {
    console.log(`     [${i + 1}] ${mapping}`);
  });

  // Special case: Only 1 srflx candidate
  // Cannot accurately distinguish Symmetric from Cone with single candidate
  if (mappings.length === 1) {
    console.warn(
      "   ⚠️  Only 1 srflx candidate after extended wait - detection may be inaccurate",
    );
    console.warn(
      "   ⚠️  Cannot distinguish Symmetric from Cone NAT with single sample",
    );
    console.warn(
      "   ⚠️  Assuming Cone NAT (most common case, ~70-80% probability)",
    );
    console.log(
      "   💡 Recommendation: Re-test on different network or wait for more candidates",
    );
    // Assume Cone NAT for single candidate (most common case)
    return {
      isPortConsistent: true, // Assume consistent (cannot verify with 1 sample)
      isIPConsistent: true,
      observedMappings: mappings,
    };
  }

  // Multiple candidates: Can accurately detect Symmetric vs Cone
  // Key insight: If we see the same external port across different STUN servers,
  // it's Cone NAT. If we see different external ports, it's Symmetric NAT.
  const isPortConsistent = uniquePorts.size <= 1;
  const isIPConsistent = uniqueIPs.size <= 1;

  if (isPortConsistent && isIPConsistent) {
    console.log(
      "   ✅ Consistent mapping detected (Cone NAT - Full/Restricted/Port-Restricted)",
    );
  } else if (!isPortConsistent) {
    console.log(
      "   ⚠️  Port varies per destination (Symmetric NAT - P2P will be difficult)",
    );
  } else if (!isIPConsistent) {
    console.log(
      "   ⚠️  IP varies per destination (unusual - possible double NAT)",
    );
  }

  return {
    isPortConsistent,
    isIPConsistent,
    observedMappings: mappings,
  };
}

/**
 * Detect NAT configuration using multiple STUN servers with a single connection
 *
 * IMPORTANT: This function uses a SINGLE RTCPeerConnection configured with multiple
 * STUN servers. This is crucial for accurate NAT type detection:
 *
 * Why Single Connection Matters:
 * - Uses the SAME local port for all STUN requests
 * - Port Restricted Cone NAT: Same local port → Same external port (all servers)
 * - Symmetric NAT: Same local port → Different external port (per server)
 *
 * Previous Approach (INCORRECT):
 * - Created separate connections for each STUN server
 * - Each connection used different local port
 * - Port Restricted Cone looked like Symmetric NAT
 *
 * How It Works:
 * 1. Create ONE RTCPeerConnection with ALL STUN servers configured
 * 2. ICE framework naturally queries all servers from same local socket
 * 3. Collect all srflx (server-reflexive) candidates
 * 4. Analyze if external port is consistent across different STUN servers
 *
 * NAT Detection Logic:
 * - All srflx candidates have same external port → Cone NAT
 * - srflx candidates have different external ports → Symmetric NAT
 *
 * @param timeout - Maximum wait time in milliseconds
 * @returns IP information and port mapping analysis with server labels
 * @throws Error if timeout occurs or all STUN servers fail
 */
async function detectWithMultipleServers(timeout: number): Promise<{
  ipInfo: IPAddressInfo;
  portMapping: PortMappingInfo;
  successfulServers: string[];
  confidence: "high" | "low";
  confidenceReason: string;
}> {
  // Configure single connection with all STUN servers
  const pc = new RTCPeerConnection({
    iceServers: STUN_SERVERS.map((server) => ({ urls: server.url })),
  });

  const candidates: RTCIceCandidate[] = [];
  const successfulServers = new Set<string>();
  let resolved = false;

  console.log(
    `🚀 Starting NAT detection with ${STUN_SERVERS.length} STUN servers on single connection`,
  );

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        pc.close();
        reject(new Error("Detection timeout"));
      }
    }, timeout);

    const finishGathering = () => {
      if (resolved) return;
      resolved = true;

      console.log(
        `✅ ICE gathering complete. Total candidates: ${candidates.length}`,
      );
      clearTimeout(timeoutId);
      pc.close();

      try {
        const ipInfo = extractIPInfo(candidates);
        const portMapping = analyzePortMapping(candidates);

        // Log detailed mapping analysis for debugging
        const srflxCandidates = candidates.filter((c) => c.type === "srflx");
        console.log(`📊 Analyzed ${srflxCandidates.length} srflx candidates:`);
        srflxCandidates.forEach((c, i) => {
          console.log(`  [${i + 1}] ${c.address}:${c.port} (via STUN server)`);
        });

        // Calculate confidence based on number of srflx candidates
        const srflxCount = portMapping.observedMappings.length;
        const confidence = srflxCount >= 2 ? "high" : "low";
        const confidenceReason =
          srflxCount >= 2
            ? `High confidence: ${srflxCount} STUN servers responded`
            : `Low confidence: Only ${srflxCount} STUN server responded (cannot verify port consistency)`;

        console.log(`📈 Detection confidence: ${confidence.toUpperCase()}`);
        console.log(`   ${confidenceReason}`);

        resolve({
          ipInfo,
          portMapping,
          successfulServers: Array.from(successfulServers),
          confidence,
          confidenceReason,
        });
      } catch (err) {
        reject(err);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const c = event.candidate;
        console.log("🔍 ICE Candidate found:", {
          type: c.type,
          protocol: c.protocol,
          address: c.address,
          port: c.port,
        });

        candidates.push(c);

        // Track which STUN server successfully responded
        // Note: We can't directly know which server each srflx came from,
        // but we know at least one worked if we got srflx candidates
        if (c.type === "srflx") {
          successfulServers.add("STUN server (via ICE)");
        }

        // Check if we have enough candidates to proceed
        const hasHost = candidates.some((c) => c.type === "host");
        const srflxCount = candidates.filter((c) => c.type === "srflx").length;

        // Early termination strategy with adaptive waiting:
        // - 1 srflx: Wait 5s (give more time to collect additional candidates)
        // - 2 srflx: Wait 2s (likely enough for accurate detection)
        // - 3+ srflx: Wait 1s (definitely enough)
        //
        // Rationale:
        // - Single srflx cannot distinguish Symmetric from Cone NAT
        // - Multiple srflx enables accurate Symmetric detection
        // - Longer wait for single srflx increases chance of getting more
        if (hasHost && srflxCount >= 1) {
          const waitTime =
            srflxCount === 1
              ? 5000 // 5s for single candidate (max effort)
              : srflxCount === 2
                ? 2000 // 2s for two candidates (good enough)
                : 1000; // 1s for 3+ candidates (optimal)

          console.log(
            `🎯 Got host and ${srflxCount} srflx candidate(s), waiting ${waitTime}ms for more`,
          );
          setTimeout(() => finishGathering(), waitTime);
        }
      } else {
        // ICE gathering complete (null candidate signals end)
        finishGathering();
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log(`🔄 ICE gathering state: ${pc.iceGatheringState}`);
      if (pc.iceGatheringState === "complete") {
        finishGathering();
      }
    };

    // Start ICE gathering
    (async () => {
      try {
        // Create a data channel to trigger ICE gathering
        pc.createDataChannel("nat-test");

        // Create an offer and set local description to start ICE gathering
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log(
          "📝 Local description set, ICE gathering started with all STUN servers",
        );
      } catch (err) {
        clearTimeout(timeoutId);
        pc.close();
        reject(err);
      }
    })();
  });
}

/**
 * Main NAT detection function using single connection with multiple STUN servers
 *
 * This is the primary entry point for NAT type detection. It uses a CORRECTED
 * approach that accurately distinguishes Cone NAT from Symmetric NAT.
 *
 * **Detection Strategy** (RFC 5780-inspired, adapted for WebRTC limitations):
 * 1. Create SINGLE RTCPeerConnection with ALL STUN servers configured
 * 2. ICE framework queries all servers from the SAME local port
 * 3. Collect multiple srflx (server-reflexive) candidates
 * 4. Analyze external port consistency across different STUN server responses
 *
 * **NAT Type Classification**:
 * - **Cone NAT**: External port stays the same across all STUN servers
 *   (Includes Full Cone, Restricted Cone, Port-Restricted Cone - can't distinguish)
 * - **Symmetric NAT**: External port changes for different STUN server destinations
 *
 * **Why This Works**:
 * - Port Restricted Cone: Same local socket → Same external port (all servers)
 * - Symmetric NAT: Same local socket → Different external port (per destination)
 *
 * **Previous Incorrect Approach**:
 * - Created separate connections (different local ports) for each STUN server
 * - Port Restricted Cone appeared as Symmetric because each connection got different external port
 *
 * **Limitations** (Browser WebRTC API constraints):
 * - Cannot use RFC 5780 CHANGE-REQUEST attribute (not exposed in WebRTC API)
 * - Cannot distinguish Full Cone from Restricted/Port-Restricted Cone
 * - Cannot test filtering behavior (would require receiving unsolicited packets)
 *
 * **Error Codes**:
 * - "TIMEOUT": Detection exceeded 15 seconds
 * - "STUN_UNREACHABLE": No STUN servers responded
 * - "BROWSER_UNSUPPORTED": WebRTC APIs not available
 *
 * @returns Object containing IP info, port mapping, and successful server info
 * @throws Error with specific error codes for different failure scenarios
 */
export async function detectNAT(): Promise<{
  ipInfo: IPAddressInfo;
  portMapping: PortMappingInfo;
  successfulServer: string;
  confidence: "high" | "low";
  confidenceReason: string;
}> {
  // Check WebRTC support
  if (typeof RTCPeerConnection === "undefined") {
    throw new Error("BROWSER_UNSUPPORTED");
  }

  console.log(
    "🚀 Starting NAT detection (single connection, multiple servers)",
  );

  try {
    const result = await detectWithMultipleServers(TOTAL_TIMEOUT);

    console.log("✅ NAT detection completed successfully");
    console.log(`   Successful servers: ${result.successfulServers.length}`);

    return {
      ipInfo: result.ipInfo,
      portMapping: result.portMapping,
      successfulServer: result.successfulServers.join(", ") || "STUN (via ICE)",
      confidence: result.confidence,
      confidenceReason: result.confidenceReason,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Map specific errors to user-friendly codes
    if (errorMessage.includes("timeout")) {
      console.error("⏱️ Detection timeout");
      throw new Error("TIMEOUT");
    }

    if (errorMessage.includes("No host candidate")) {
      console.error("❌ No host candidate found (network issue)");
      throw new Error("STUN_UNREACHABLE");
    }

    console.error("❌ NAT detection failed:", err);
    throw new Error("STUN_UNREACHABLE");
  }
}
