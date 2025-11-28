import { useCallback, useEffect, useState } from "react";
import {
  detectNATAdvanced,
  isAdvancedDetectionAvailable,
} from "@/lib/nat-detection/advanced-detector";
import { classifyNAT } from "@/lib/nat-detection/nat-classifier";
import {
  DetectionError,
  type DetectionResult,
  DetectionState,
} from "@/lib/nat-detection/types";
import { detectNAT } from "@/lib/nat-detection/webrtc-detector";

export function useNATDetection() {
  const [result, setResult] = useState<DetectionResult>({
    state: DetectionState.IDLE,
    natType: null,
    startedAt: new Date(),
    completedAt: null,
    durationMs: null,
    ipInfo: null,
    portMapping: null,
    error: null,
    successfulSTUNServer: null,
    confidence: null,
    confidenceReason: null,
  });

  const [isAdvancedAvailable, setIsAdvancedAvailable] = useState(false);

  // Check if advanced detection is available
  useEffect(() => {
    isAdvancedDetectionAvailable().then(setIsAdvancedAvailable);
  }, []);

  const runDetection = useCallback(async () => {
    const startedAt = new Date();
    setResult({
      state: DetectionState.DETECTING,
      natType: null,
      startedAt,
      completedAt: null,
      durationMs: null,
      ipInfo: null,
      portMapping: null,
      error: null,
      successfulSTUNServer: null,
      confidence: null,
      confidenceReason: null,
    });

    try {
      // Try advanced detection first if available
      if (isAdvancedAvailable) {
        console.log("🔬 Using advanced detection (preferred method)");
        const advancedResult = await detectNATAdvanced();
        setResult(advancedResult);
        return;
      }

      // Fallback to basic WebRTC detection
      console.log("📡 Using basic WebRTC detection (fallback)");
      const {
        ipInfo,
        portMapping,
        successfulServer,
        confidence,
        confidenceReason,
      } = await detectNAT();
      const natType = classifyNAT(ipInfo, portMapping);
      const completedAt = new Date();

      setResult({
        state: DetectionState.SUCCESS,
        natType,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        ipInfo,
        portMapping,
        error: null,
        successfulSTUNServer: successfulServer,
        confidence,
        confidenceReason,
        detectionMethod: "basic",
      });
    } catch (err: unknown) {
      const completedAt = new Date();

      // Map error messages to DetectionError enum
      let errorType: DetectionError;
      const rawErrorMessage = err instanceof Error ? err.message : String(err);

      if (
        rawErrorMessage === "TIMEOUT" ||
        rawErrorMessage.includes("timeout")
      ) {
        errorType = DetectionError.TIMEOUT;
      } else if (
        rawErrorMessage === "STUN_UNREACHABLE" ||
        rawErrorMessage.includes("failed")
      ) {
        errorType = DetectionError.STUN_UNREACHABLE;
      } else if (
        rawErrorMessage.includes("unsupported") ||
        rawErrorMessage.includes("RTCPeerConnection")
      ) {
        errorType = DetectionError.BROWSER_UNSUPPORTED;
      } else if (rawErrorMessage.includes("permission")) {
        errorType = DetectionError.PERMISSION_DENIED;
      } else {
        errorType = DetectionError.UNKNOWN;
      }

      // Error message will be translated by the component
      setResult({
        state: DetectionState.ERROR,
        natType: null,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        ipInfo: null,
        portMapping: null,
        error: {
          type: errorType,
          message: rawErrorMessage, // Raw message, will be translated by component
        },
        successfulSTUNServer: null,
        confidence: null,
        confidenceReason: null,
      });
    }
  }, [isAdvancedAvailable]);

  const runAdvancedDetection = useCallback(async () => {
    setResult((prev) => ({
      ...prev,
      state: DetectionState.DETECTING,
    }));

    try {
      const advancedResult = await detectNATAdvanced();
      setResult(advancedResult);
    } catch (err: unknown) {
      const completedAt = new Date();
      const startedAt = result.startedAt;

      setResult({
        state: DetectionState.ERROR,
        natType: null,
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        ipInfo: null,
        portMapping: null,
        error: {
          type: DetectionError.UNKNOWN,
          message:
            err instanceof Error ? err.message : "Advanced detection failed",
        },
        successfulSTUNServer: null,
        confidence: null,
        confidenceReason: null,
        detectionMethod: "advanced",
      });
    }
  }, [result.startedAt]);

  return {
    result,
    runDetection,
    runAdvancedDetection,
    isAdvancedAvailable,
  };
}
