import { isCGNATIP, isPrivateIP } from "./ip"
import { NATType } from "./types"
import type {
  ConfidenceReason,
  DetectableNATType,
  IPAddressInfo,
  PortMappingInfo,
} from "./types"

/**
 * Map the observations from the detector to a NAT type.
 *
 * Only mapping behavior is observable from a browser, so the verdict is one of
 * NO_NAT, CONE_NAT, SYMMETRIC, MULTIPLE_LAYERS or UNKNOWN. Cone subtypes
 * (filtering behavior) are never returned.
 */
export function classifyNAT(
  ipInfo: IPAddressInfo,
  portMapping: PortMappingInfo,
  confidenceReason: ConfidenceReason
): DetectableNATType {
  // Directly connected public host: srflx equals host, or no srflx at all
  // while the host address is public.
  if (ipInfo.natPresence === "absent") {
    return NATType.NO_NAT
  }

  // Mapping behavior cannot be judged from a single destination.
  if (
    confidenceReason === "SINGLE_SERVER_ONLY" ||
    confidenceReason === "NO_MAPPINGS"
  ) {
    return NATType.UNKNOWN
  }

  if (!portMapping.isMappingConsistent) {
    return NATType.SYMMETRIC
  }

  // A private/shared external address means the STUN server itself sat behind
  // another NAT layer relative to us (only possible with an in-network STUN
  // server). Combined with a private local address that is a double NAT.
  const publicIsInternal =
    ipInfo.publicIP !== null &&
    (isPrivateIP(ipInfo.publicIP) || isCGNATIP(ipInfo.publicIP))
  const localIsPrivate =
    ipInfo.localAddress !== null &&
    !ipInfo.isLocalAddressObfuscated &&
    isPrivateIP(ipInfo.localAddress)
  if (publicIsInternal && localIsPrivate) {
    return NATType.MULTIPLE_LAYERS
  }

  return NATType.CONE_NAT
}
