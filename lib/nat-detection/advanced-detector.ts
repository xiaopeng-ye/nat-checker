/**
 * Advanced NAT Detection Client
 *
 * This module provides client-side functionality for advanced NAT type detection.
 * It works in conjunction with the server-side API to perform RFC 5780-based tests.
 *
 * Flow:
 * 1. Perform basic WebRTC detection to get public IP/port
 * 2. Send information to server API
 * 3. Server coordinates advanced test sequence
 * 4. Return precise NAT type classification
 *
 * Advantages over basic WebRTC detection:
 * - Can distinguish Full Cone, Restricted Cone, Port-Restricted Cone
 * - Higher accuracy through controlled test sequence
 * - Server-side analysis reduces client complexity
 */

import {
  type DetectionError,
  type DetectionResult,
  DetectionState,
  NATType,
} from "./types";
import { detectNAT } from "./webrtc-detector";

interface AdvancedDetectionResponse {
  success: boolean;
  natType?: NATType;
  confidence: "high" | "low";
  confidenceReason: string;
  tests: {
    test1: { passed: boolean; description: string };
    test2: { passed: boolean; description: string };
    test3: { passed: boolean; description: string };
    test4: { passed: boolean; description: string };
  };
  error?: string;
}

/**
 * Perform advanced NAT detection using server-side tests
 *
 * This function:
 * 1. First runs basic WebRTC detection to establish baseline
 * 2. Sends results to server API for advanced analysis
 * 3. Returns enhanced detection result with precise NAT type
 *
 * @returns DetectionResult with precise NAT type classification
 * @throws Error if detection fails or server is unreachable
 */
export async function detectNATAdvanced(): Promise<DetectionResult> {
  const startedAt = new Date();

  console.log("🔬 Starting advanced NAT detection");
  console.log("   Step 1: Basic WebRTC detection");

  try {
    // Step 1: Perform basic WebRTC detection
    const basicResult = await detectNAT();

    if (!basicResult.ipInfo?.publicIP || !basicResult.ipInfo?.publicPort) {
      throw new Error("Failed to get public IP/port from basic detection");
    }

    console.log("   ✅ Basic detection complete");
    console.log(
      `      Public: ${basicResult.ipInfo.publicIP}:${basicResult.ipInfo.publicPort}`,
    );
    console.log(`      Basic NAT type: ${basicResult.successfulServer}`);

    // Step 2: Call server API for advanced tests
    console.log("   Step 2: Calling advanced detection API");

    const apiResponse = await fetch("/api/nat-detect/advanced", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicIP: basicResult.ipInfo.publicIP,
        publicPort: basicResult.ipInfo.publicPort,
        localIP: basicResult.ipInfo.localIP,
      }),
    });

    if (!apiResponse.ok) {
      throw new Error(
        `Server API returned ${apiResponse.status}: ${apiResponse.statusText}`,
      );
    }

    const advancedData: AdvancedDetectionResponse = await apiResponse.json();

    if (!advancedData.success) {
      throw new Error(
        advancedData.error || "Advanced detection failed on server",
      );
    }

    console.log("   ✅ Advanced detection complete");
    console.log(`      Precise NAT type: ${advancedData.natType}`);
    console.log(`      Confidence: ${advancedData.confidence}`);

    // Log test results
    console.log("   📊 Test Results:");
    console.log(
      `      Test I:   ${advancedData.tests.test1.passed ? "✅" : "❌"} ${advancedData.tests.test1.description}`,
    );
    console.log(
      `      Test II:  ${advancedData.tests.test2.passed ? "✅" : "❌"} ${advancedData.tests.test2.description}`,
    );
    console.log(
      `      Test III: ${advancedData.tests.test3.passed ? "✅" : "❌"} ${advancedData.tests.test3.description}`,
    );
    console.log(
      `      Test IV:  ${advancedData.tests.test4.passed ? "✅" : "❌"} ${advancedData.tests.test4.description}`,
    );

    // Build final result
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const result: DetectionResult = {
      state: DetectionState.SUCCESS,
      natType: advancedData.natType || NATType.CONE_NAT,
      startedAt,
      completedAt,
      durationMs,
      ipInfo: basicResult.ipInfo,
      portMapping: basicResult.portMapping,
      error: null,
      successfulSTUNServer: "Advanced Detection (RFC 5780)",
      confidence: advancedData.confidence,
      confidenceReason: advancedData.confidenceReason,
      detectionMethod: "advanced",
    };

    return result;
  } catch (error) {
    console.error("❌ Advanced detection failed:", error);

    // Return error result
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    return {
      state: DetectionState.ERROR,
      natType: null,
      startedAt,
      completedAt,
      durationMs,
      ipInfo: null,
      portMapping: null,
      error: {
        type: "UNKNOWN" as DetectionError,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      successfulSTUNServer: null,
      confidence: null,
      confidenceReason: null,
      detectionMethod: "advanced",
    };
  }
}

/**
 * Check if advanced detection is available
 *
 * This function pings the server API to verify it's reachable
 *
 * @returns true if server is available, false otherwise
 */
export async function isAdvancedDetectionAvailable(): Promise<boolean> {
  try {
    const response = await fetch("/api/nat-detect/advanced", {
      method: "GET",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.service === "Advanced NAT Detection";
  } catch (error) {
    console.warn("⚠️  Advanced detection server not available:", error);
    return false;
  }
}
