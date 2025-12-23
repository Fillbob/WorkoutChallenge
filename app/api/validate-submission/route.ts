import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { calculatePoints, determineNextStatus } from '@/lib/points';
import type { ResponseInputItem } from 'openai/resources/responses/responses';

const requestSchema = z.object({ submissionId: z.string() });

const verdictSchema = {
  name: 'submission_verdict',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['verdict', 'confidence', 'reasons', 'extracted_signals'],
    properties: {
      verdict: { type: 'string', enum: ['pass', 'fail', 'needs_review'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      reasons: { type: 'array', items: { type: 'string' } },
      extracted_signals: { type: 'array', items: { type: 'string' } }
    }
  },
  strict: true
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { submissionId } = requestSchema.parse(body);

    const supabase = getServiceRoleClient();
    const { data: submission } = await supabase
      .from('submissions')
      .select('*, challenges(*), submission_images(*)')
      .eq('id', submissionId)
      .maybeSingle();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const imagePaths = (submission.submission_images ?? []).map((img: any) => img.storage_path);
    if (imagePaths.length === 0) {
      return NextResponse.json({ error: 'No proof images attached' }, { status: 400 });
    }
    const { data: signedUrls, error: urlError } = await supabase.storage
      .from('submission-proofs')
      .createSignedUrls(imagePaths, 60 * 10);

    if (urlError) {
      return NextResponse.json({ error: 'Unable to sign images' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const content: ResponseInputItem.Message['content'] = [
      {
        type: 'text',
        text: `Challenge description: ${submission.challenges?.description}\nBonus rules: ${
          submission.challenges?.bonus_rules ?? 'none'
        }\nStretch rules: ${submission.challenges?.stretch_rules ?? 'none'}`
      },
      ...signedUrls.map((signed: { signedUrl: string }) => ({
        type: 'input_image',
        image_url: { url: signed.signedUrl }
      }))
    ];

    const response = await openai.responses.create({
      model: 'gpt-4o-mini-1.1',
      instructions:
        'You are a strict fitness challenge validator. Output ONLY valid JSON that matches the provided schema. If unsure, respond with verdict "needs_review". Never hallucinate details. Reject blurry or unrelated images.',
      input: [
        {
          role: 'user',
          content
        }
      ],
      response_format: { type: 'json_schema', json_schema: verdictSchema }
    });

    const json = (response.output?.[0] as any)?.content?.[0]?.json as {
      verdict: 'pass' | 'fail' | 'needs_review';
      confidence: number;
      reasons: string[];
      extracted_signals: string[];
    };

    const nextStatus = determineNextStatus({ verdict: json.verdict, confidence: json.confidence });

    const updatePayload: Record<string, any> = {
      status: nextStatus,
      ai_verdict: json.verdict,
      ai_confidence: json.confidence,
      ai_reasons: json.reasons,
      updated_at: new Date().toISOString()
    };

    if (nextStatus === 'auto_approved') {
      const points = calculatePoints(
        {
          base_points: submission.challenges.base_points,
          bonus_points: submission.challenges.bonus_points,
          stretch_points: submission.challenges.stretch_points
        },
        { verdict: json.verdict, confidence: json.confidence }
      );
      updatePayload.points_awarded = points;
      await supabase.from('points_ledger').insert({
        user_id: submission.user_id,
        challenge_id: submission.challenge_id,
        submission_id: submission.id,
        points,
        reason: 'auto_approved'
      });
      await supabase.from('admin_audit').insert({
        admin_user_id: submission.user_id,
        action: 'auto_approve',
        target_table: 'submissions',
        target_id: submission.id,
        before: {},
        after: updatePayload
      });
    }

    await supabase.from('submissions').update(updatePayload).eq('id', submission.id);

    return NextResponse.json({ status: nextStatus, ai: json });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Validation failed', detail: error.message }, { status: 500 });
  }
}
