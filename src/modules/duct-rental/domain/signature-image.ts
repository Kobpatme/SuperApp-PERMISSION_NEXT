export function isNearWhitePaperPixel(red: number, green: number, blue: number) {
  return red > 220 && green > 220 && blue > 220 && Math.max(red, green, blue) - Math.min(red, green, blue) < 28;
}
export function cropSignaturePixels(input: Uint8ClampedArray, width: number, height: number) {
  const pixels = new Uint8ClampedArray(input); let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = (y * width + x) * 4;
    if (isNearWhitePaperPixel(pixels[at], pixels[at + 1], pixels[at + 2])) pixels[at + 3] = 0;
    else if (pixels[at + 3] > 16) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
  }
  if (right < left) return { pixels, width, height, hasInk: false };
  const x = Math.max(0, left - 4), y = Math.max(0, top - 4), croppedWidth = Math.min(width - x, right - left + 9), croppedHeight = Math.min(height - y, bottom - top + 9), cropped = new Uint8ClampedArray(croppedWidth * croppedHeight * 4);
  for (let row = 0; row < croppedHeight; row++) cropped.set(pixels.subarray(((row + y) * width + x) * 4, ((row + y) * width + x + croppedWidth) * 4), row * croppedWidth * 4);
  return { pixels: cropped, width: croppedWidth, height: croppedHeight, hasInk: true };
}
