export { classifyNAT } from "./classifier"
export { detectNAT, parseCandidate } from "./detector"
export type {
  CandidateLike,
  DetectNATOptions,
  DetectionLogger,
} from "./detector"
export { NATDetectionError, toDetectionError } from "./errors"
export { isCGNATIP, isIPv4, isMDNSName, isPrivateIP } from "./ip"
export { STUN_SERVERS } from "./stun-servers"
export type { STUNServer } from "./stun-servers"
export { DetectionError, DetectionState, NATType } from "./types"
export type {
  ConfidenceReason,
  DetectableNATType,
  DetectionConfidence,
  DetectionOutput,
  DetectionResult,
  IPAddressInfo,
  NATPresence,
  ObservedMapping,
  PortMappingInfo,
} from "./types"
