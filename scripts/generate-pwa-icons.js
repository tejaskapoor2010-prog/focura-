import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const sourcePath = path.resolve('public/favicon.jpg');
  const pubDir = path.resolve('public');

  if (!fs.existsSync(sourcePath)) {
    console.error('Source icon not found:', sourcePath);
    process.exit(1);
  }

  // 1. Generate 192x192 standard icon
  await sharp(sourcePath)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(path.join(pubDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 2. Generate 512x512 standard icon
  await sharp(sourcePath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(path.join(pubDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 3. Generate Apple Touch Icon 180x180
  await sharp(sourcePath)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(path.join(pubDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 4. Generate Maskable Icon 512x512 (with 15% safe margin)
  // Inner image size: 512 * 0.75 = 384x384
  const innerBuffer = await sharp(sourcePath)
    .resize(384, 384, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      {
        input: innerBuffer,
        top: 64,
        left: 64,
      },
    ])
    .png()
    .toFile(path.join(pubDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
