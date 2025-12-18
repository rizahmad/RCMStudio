import { NextResponse } from 'next/server';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import crypto from 'crypto';
import { requireAuth } from '../../../../lib/authGuard';
import { ok, badRequest } from '../../../../lib/http';

const mediaRoot = path.join(process.cwd(), 'media', 'insurance-cards');

export async function POST(request) {
  const { ctx, error } = requireAuth(request, ['ADMIN', 'BILLER']);
  if (error) return error;
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return badRequest('file required');
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = path.extname(file.name || '') || '.bin';
  const filename = `${crypto.randomUUID()}${ext}`;
  await mkdir(mediaRoot, { recursive: true });
  const targetPath = path.join(mediaRoot, filename);
  await writeFile(targetPath, buffer);
  const relativeUrl = `/media/insurance-cards/${filename}`;
  return ok({ url: relativeUrl, size: buffer.length, uploadedBy: ctx.user.id });
}
