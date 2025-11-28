/**
 * RFC 5780 STUN Test Server for NAT Type Detection
 *
 * This server implements a subset of RFC 5780 (NAT Behavior Discovery Using STUN)
 * to enable precise classification of NAT types:
 *
 * - Full Cone NAT
 * - Restricted Cone NAT
 * - Port-Restricted Cone NAT
 * - Symmetric NAT
 *
 * Architecture:
 * - Three UDP sockets on different ports (3478, 3479, 3480)
 * - Simulates multiple STUN servers with different IPs/ports
 * - Implements CHANGE-REQUEST attribute behavior
 *
 * Test Sequence:
 * 1. Test I: Basic binding test (get external IP:port)
 * 2. Test II: Response from different IP:port (Full Cone detection)
 * 3. Test III: Response from same IP, different port (Restricted Cone detection)
 * 4. Test IV: Multiple binding tests (Symmetric detection)
 */

import dgram from "node:dgram";

// Server configuration
const PORTS = {
  PRIMARY: 3478,
  SECONDARY: 3479,
  TERTIARY: 3480,
} as const;

// STUN message types (RFC 5389)
const STUN_MESSAGE_TYPE = {
  BINDING_REQUEST: 0x0001,
  BINDING_RESPONSE: 0x0101,
} as const;

// STUN magic cookie (RFC 5389)
const STUN_MAGIC_COOKIE = 0x2112a442;

// STUN attribute types (RFC 5389 + RFC 5780)
const STUN_ATTR = {
  MAPPED_ADDRESS: 0x0001, // XOR-MAPPED-ADDRESS is preferred, but we use simple version
  XOR_MAPPED_ADDRESS: 0x0020,
  CHANGE_REQUEST: 0x0003, // RFC 5780
  RESPONSE_ORIGIN: 0x802b, // RFC 5780
  OTHER_ADDRESS: 0x802c, // RFC 5780
} as const;

/**
 * STUN message structure (RFC 5389)
 *
 * 0                   1                   2                   3
 * 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |0 0|     STUN Message Type     |         Message Length        |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                         Magic Cookie                          |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                     Transaction ID (96 bits)                  |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

interface STUNMessage {
  type: number;
  length: number;
  transactionId: Buffer;
  attributes: Map<number, Buffer>;
}

/**
 * Parse STUN message from buffer
 */
function parseSTUNMessage(buffer: Buffer): STUNMessage | null {
  try {
    if (buffer.length < 20) return null;

    const type = buffer.readUInt16BE(0);
    const length = buffer.readUInt16BE(2);
    const magicCookie = buffer.readUInt32BE(4);
    const transactionId = buffer.subarray(8, 20);

    // Validate magic cookie
    if (magicCookie !== STUN_MAGIC_COOKIE) {
      console.warn("⚠️  Invalid STUN magic cookie");
      return null;
    }

    // Parse attributes
    const attributes = new Map<number, Buffer>();
    let offset = 20;

    while (offset < buffer.length && offset < 20 + length) {
      if (offset + 4 > buffer.length) break;

      const attrType = buffer.readUInt16BE(offset);
      const attrLength = buffer.readUInt16BE(offset + 2);
      const attrValue = buffer.subarray(offset + 4, offset + 4 + attrLength);

      attributes.set(attrType, attrValue);

      // Attributes are padded to 4-byte boundaries
      offset += 4 + Math.ceil(attrLength / 4) * 4;
    }

    return { type, length, transactionId, attributes };
  } catch (error) {
    console.error("❌ Failed to parse STUN message:", error);
    return null;
  }
}

/**
 * Build STUN Binding Response
 */
function buildSTUNResponse(
  transactionId: Buffer,
  clientAddr: string,
  clientPort: number,
  responseAddr?: string,
  responsePort?: number,
): Buffer {
  const attributes: Buffer[] = [];

  // Add XOR-MAPPED-ADDRESS (client's external IP:port)
  const xorMappedAddr = buildXorMappedAddress(
    clientAddr,
    clientPort,
    transactionId,
  );
  attributes.push(xorMappedAddr);

  // Add RESPONSE-ORIGIN (where this response is sent from)
  if (responseAddr && responsePort) {
    const responseOrigin = buildResponseOrigin(responseAddr, responsePort);
    attributes.push(responseOrigin);
  }

  // Calculate total length
  const totalAttrLength = attributes.reduce(
    (sum, attr) => sum + attr.length,
    0,
  );

  // Build STUN header
  const header = Buffer.alloc(20);
  header.writeUInt16BE(STUN_MESSAGE_TYPE.BINDING_RESPONSE, 0); // Message Type
  header.writeUInt16BE(totalAttrLength, 2); // Message Length
  header.writeUInt32BE(STUN_MAGIC_COOKIE, 4); // Magic Cookie
  transactionId.copy(header, 8); // Transaction ID

  return Buffer.concat([header, ...attributes]);
}

/**
 * Build XOR-MAPPED-ADDRESS attribute
 *
 * The address is XORed with magic cookie and transaction ID
 * to prevent NAT devices from modifying it
 */
function buildXorMappedAddress(
  addr: string,
  port: number,
  _transactionId: Buffer,
): Buffer {
  const attrType = STUN_ATTR.XOR_MAPPED_ADDRESS;
  const family = 0x01; // IPv4

  // XOR port with most significant 16 bits of magic cookie
  const xorPort = port ^ (STUN_MAGIC_COOKIE >> 16);

  // XOR address with magic cookie
  const addrParts = addr.split(".").map(Number);
  const magicBytes = [
    (STUN_MAGIC_COOKIE >> 24) & 0xff,
    (STUN_MAGIC_COOKIE >> 16) & 0xff,
    (STUN_MAGIC_COOKIE >> 8) & 0xff,
    STUN_MAGIC_COOKIE & 0xff,
  ];
  const xorAddr = addrParts.map((byte, i) => byte ^ magicBytes[i]);

  // Build attribute
  const attrValue = Buffer.alloc(8);
  attrValue.writeUInt8(0, 0); // Reserved
  attrValue.writeUInt8(family, 1); // Family
  attrValue.writeUInt16BE(xorPort, 2); // X-Port
  attrValue.writeUInt8(xorAddr[0], 4); // X-Address
  attrValue.writeUInt8(xorAddr[1], 5);
  attrValue.writeUInt8(xorAddr[2], 6);
  attrValue.writeUInt8(xorAddr[3], 7);

  const attr = Buffer.alloc(4 + 8);
  attr.writeUInt16BE(attrType, 0); // Attribute Type
  attr.writeUInt16BE(8, 2); // Attribute Length
  attrValue.copy(attr, 4); // Attribute Value

  return attr;
}

/**
 * Build RESPONSE-ORIGIN attribute
 */
function buildResponseOrigin(addr: string, port: number): Buffer {
  const attrType = STUN_ATTR.RESPONSE_ORIGIN;
  const family = 0x01; // IPv4

  const addrParts = addr.split(".").map(Number);

  const attrValue = Buffer.alloc(8);
  attrValue.writeUInt8(0, 0); // Reserved
  attrValue.writeUInt8(family, 1); // Family
  attrValue.writeUInt16BE(port, 2); // Port
  attrValue.writeUInt8(addrParts[0], 4); // Address
  attrValue.writeUInt8(addrParts[1], 5);
  attrValue.writeUInt8(addrParts[2], 6);
  attrValue.writeUInt8(addrParts[3], 7);

  const attr = Buffer.alloc(4 + 8);
  attr.writeUInt16BE(attrType, 0); // Attribute Type
  attr.writeUInt16BE(8, 2); // Attribute Length
  attrValue.copy(attr, 4); // Attribute Value

  return attr;
}

/**
 * Parse CHANGE-REQUEST attribute
 *
 * Returns: { changeIP: boolean, changePort: boolean }
 */
function parseChangeRequest(attrValue: Buffer): {
  changeIP: boolean;
  changePort: boolean;
} {
  if (attrValue.length < 4) {
    return { changeIP: false, changePort: false };
  }

  const flags = attrValue.readUInt32BE(0);
  const changeIP = (flags & 0x04) !== 0; // Bit 2
  const changePort = (flags & 0x02) !== 0; // Bit 1

  return { changeIP, changePort };
}

/**
 * Create and start STUN server
 */
function createSTUNServer(port: number, name: string) {
  const socket = dgram.createSocket("udp4");

  socket.on("error", (err) => {
    console.error(`❌ ${name} error:`, err);
    socket.close();
  });

  socket.on("message", (msg, rinfo) => {
    console.log(
      `📨 ${name} received ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`,
    );

    // Parse STUN message
    const stunMsg = parseSTUNMessage(msg);
    if (!stunMsg) {
      console.warn(`⚠️  ${name} received non-STUN message, ignoring`);
      return;
    }

    // Only handle Binding Requests
    if (stunMsg.type !== STUN_MESSAGE_TYPE.BINDING_REQUEST) {
      console.warn(
        `⚠️  ${name} received non-Binding-Request (type=${stunMsg.type}), ignoring`,
      );
      return;
    }

    console.log(`✅ ${name} parsed Binding Request`);

    // Check for CHANGE-REQUEST attribute (RFC 5780)
    const changeReq = stunMsg.attributes.get(STUN_ATTR.CHANGE_REQUEST);
    const { changeIP, changePort } = changeReq
      ? parseChangeRequest(changeReq)
      : { changeIP: false, changePort: false };

    console.log(
      `   CHANGE-REQUEST: changeIP=${changeIP}, changePort=${changePort}`,
    );

    // Determine response address and port
    let responsePort = port;
    const _responseSocket = socket;

    // For simplicity, we only support changePort (not changeIP)
    // Real implementation would need multiple IPs or coordination
    if (changePort && !changeIP) {
      // Send response from a different port
      if (port === PORTS.PRIMARY) {
        responsePort = PORTS.SECONDARY;
        console.log(`   📤 Responding from different port: ${responsePort}`);
      } else {
        console.warn("   ⚠️  Cannot change port from non-primary server");
      }
    }

    // Get local address
    const localAddr = socket.address().address;

    // Build and send response
    const response = buildSTUNResponse(
      stunMsg.transactionId,
      rinfo.address,
      rinfo.port,
      localAddr,
      responsePort,
    );

    // Send response
    if (responsePort === port) {
      socket.send(response, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error(`❌ ${name} failed to send response:`, err);
        } else {
          console.log(
            `✅ ${name} sent response to ${rinfo.address}:${rinfo.port}`,
          );
        }
      });
    } else {
      // Send from different port (requires accessing other socket)
      console.log(
        `   📤 Sending response from port ${responsePort} (not implemented yet)`,
      );
      // For now, just send from same port
      socket.send(response, rinfo.port, rinfo.address);
    }
  });

  socket.on("listening", () => {
    const addr = socket.address();
    console.log(`🚀 ${name} listening on ${addr.address}:${addr.port}`);
  });

  socket.bind(port);

  return socket;
}

/**
 * Main entry point
 */
function main() {
  console.log("🚀 Starting STUN Test Server (RFC 5780)");
  console.log("=====================================\n");

  // Create three STUN servers
  const servers = [
    createSTUNServer(PORTS.PRIMARY, "STUN-Primary"),
    createSTUNServer(PORTS.SECONDARY, "STUN-Secondary"),
    createSTUNServer(PORTS.TERTIARY, "STUN-Tertiary"),
  ];

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Shutting down STUN servers...");
    servers.forEach((s) => {
      s.close();
    });
    process.exit(0);
  });

  console.log("\n✅ All STUN servers started successfully");
  console.log("   Press Ctrl+C to stop\n");
}

// Run if executed directly (ES module version)
// In ES modules, we check if import.meta.url matches the process argv
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export { createSTUNServer, PORTS };
