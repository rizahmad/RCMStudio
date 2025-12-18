import { NextResponse } from 'next/server';

export function ok(data, init = {}) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
