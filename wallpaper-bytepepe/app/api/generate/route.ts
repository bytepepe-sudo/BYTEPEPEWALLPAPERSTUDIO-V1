import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File;

  if (!file) {
    return new NextResponse('No file', { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 🔍 читаем изображение БЕЗ ИЗМЕНЕНИЙ
  const image = sharp(buffer, { unlimited: true });
  const meta = await image.metadata();

  if (!meta.width || !meta.height) {
    return new NextResponse('Invalid image', { status: 400 });
  }

  const TARGET_WIDTH = meta.width;
  const TARGET_HEIGHT = 2532; // iPhone default

  if (TARGET_HEIGHT <= meta.height) {
    return new NextResponse('Target height must be larger', { status: 400 });
  }

  // 🎯 1. Берём TOP-RIGHT 8x8 ПИКСЕЛЕЙ
  const colorSample = await image
    .extract({
      left: meta.width - 8,
      top: 0,
      width: 8,
      height: 8
    })
    .raw()
    .toBuffer();

  // 🧠 определяем первый пиксель как эталон
  const r = colorSample[0];
  const g = colorSample[1];
  const b = colorSample[2];
  const a = colorSample[3] ?? 255;

  // 🧱 2. Создаём фон нужной высоты
  const backgroundHeight = TARGET_HEIGHT - meta.height;

  const background = sharp({
    create: {
      width: TARGET_WIDTH,
      height: backgroundHeight,
      channels: 4,
      background: { r, g, b, alpha: a / 255 }
    }
  });

  // 🔒 3. Склеиваем: фон СВЕРХУ, NFT СНИЗУ
  const finalImage = await sharp({
    create: {
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
      channels: 4,
      background: { r, g, b, alpha: 1 }
    }
  })
    .composite([
      { input: await background.png().toBuffer(), top: 0, left: 0 },
      { input: buffer, top: backgroundHeight, left: 0 }
    ])
    .png({
      compressionLevel: 0,
      adaptiveFiltering: false
    })
    .toBuffer();

  return new NextResponse(finalImage, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="Wallpaper-BytePepe.png"'
    }
  });
}