export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;

  for (let index = 0; index < len; index++) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}
