export function uint8ArrayToBase64(binaryData: Uint8Array | ArrayBuffer): string {
  const bytes = binaryData instanceof Uint8Array ? binaryData : new Uint8Array(binaryData);
  let binaryString = "";
  const length = bytes.byteLength;

  for (let index = 0; index < length; index++) {
    binaryString += String.fromCharCode(bytes[index]);
  }

  return btoa(binaryString);
}
