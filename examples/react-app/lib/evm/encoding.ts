import {
  encodeAbiParameters,
  hexToBytes,
  parseSignature,
  serializeCompactSignature,
  signatureToCompactSignature,
  type Hex,
} from "viem";

export function encodeCompactSignature(serializedSignature: Hex) {
  const signature = parseSignature(serializedSignature);
  const compactSignature = signatureToCompactSignature(signature);
  const serializedCompactSignature =
    serializeCompactSignature(compactSignature);

  const bytes = hexToBytes(serializedCompactSignature);

  return bytes;
}

export function encodeTypedData(typedData: any) {
  return hexToBytes(
    encodeAbiParameters(
      typedData.types[typedData.primaryType],
      typedData.types[typedData.primaryType].map(
        (type: any) => typedData.message[type.name],
      ),
    ),
  );
}
