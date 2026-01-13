import { NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';

type PushBody = {
  prompt?: string;
  meta?: any;
};

/**
 * CRM endpoint to push a generated System Prompt to VoiceHub.
 * Expects:
 *  - Header: x-wallet (string, required)
 *  - Body: { prompt: string, meta?: any }
 *
 * If VOICEHUB_BASE_URL (or NEXT_PUBLIC_VOICEHUB_BASE_URL) is configured, this will forward
 * the payload to VoiceHub at /api/crm/prompt/push. Otherwise, it will succeed without forwarding
 * (echo payload) so the CRM UI can continue, while VoiceHub integration is pending.
 */
export async function POST(req: Request) {
  try {
    const wallet = (req.headers.get('x-wallet') || '').trim().toLowerCase();
    if (!wallet) {
      return NextResponse.json({ ok: false, error: 'Missing wallet (x-wallet header required)' }, { status: 400 });
    }

    let body: PushBody = {};
    try {
      body = (await req.json()) as PushBody;
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const prompt = String(body?.prompt || '').trim();
    const meta = body?.meta ?? {};

    if (!prompt) {
      return NextResponse.json({ ok: false, error: 'Missing prompt' }, { status: 400 });
    }

    const payload = {
      wallet,
      prompt,
      meta,
      ts: new Date().toISOString(),
      source: 'basaltcrm',
    };

    // Persist last used wallet for VoiceHub status indicator
    try {
      const existing = await prismadb.systemServices.findFirst({ where: { name: 'voicehub' } });
      if (existing?.id) {
        await prismadb.systemServices.update({ where: { id: existing.id }, data: { serviceId: wallet } });
      } else {
        await prismadb.systemServices.create({ data: { name: 'voicehub', serviceId: wallet, v: 0 } });
      }
    } catch { }

    let base = String(process.env.VOICEHUB_BASE_URL || process.env.NEXT_PUBLIC_VOICEHUB_BASE_URL || '').trim().replace(/\/+$/, '');
    if (!base) {
      try {
        const svc = await prismadb.systemServices.findFirst({ where: { name: 'voicehub' } });
        base = String(svc?.serviceUrl || '').trim().replace(/\/+$/, '');
      } catch { }
    }

    if (base) {
      try {
        const resp = await fetch(`${base}/api/crm/prompt/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet': wallet,
          },
          body: JSON.stringify(payload),
        });

        const text = await resp.text().catch(() => '');
        if (!resp.ok) {
          return NextResponse.json(
            {
              ok: false,
              forwarded: false,
              error: text || `VoiceHub responded with status ${resp.status}`,
            },
            { status: resp.status },
          );
        }

        let voicehub: any = null;
        try {
          voicehub = JSON.parse(text);
        } catch {
          voicehub = text;
        }

        return NextResponse.json(
          {
            ok: true,
            forwarded: true,
            voicehub,
          },
          { status: 200 },
        );
      } catch (e: any) {
        return NextResponse.json(
          {
            ok: false,
            forwarded: false,
            error: e?.message || 'Failed to forward to VoiceHub',
          },
          { status: 502 },
        );
      }
    }

    // No VoiceHub configured: succeed without forwarding, echo payload for debugging.
    return NextResponse.json(
      {
        ok: true,
        forwarded: false,
        stored: false,
        payload,
        hint:
          'Set VOICEHUB_BASE_URL or NEXT_PUBLIC_VOICEHUB_BASE_URL in environment to enable forwarding to VoiceHub.',
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unhandled error' }, { status: 500 });
  }
}
