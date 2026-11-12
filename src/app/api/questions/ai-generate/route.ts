import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateAIQuestions } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { topic, difficulty = 'MEDIUM', count = 3 } = await req.json();

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const questionCount = Math.min(Math.max(1, Number(count) || 3), 10);
    const validDifficulty = (['EASY', 'MEDIUM', 'HARD'].includes(difficulty?.toUpperCase())
      ? difficulty.toUpperCase()
      : 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD';

    const questions = await generateAIQuestions({
      topic: topic.trim(),
      difficulty: validDifficulty,
      count: questionCount,
    });

    return NextResponse.json({
      success: true,
      topic: topic.trim(),
      difficulty: validDifficulty,
      questions,
    });
  } catch (error: any) {
    console.error('AI question generation error:', error);
    return NextResponse.json({ error: 'Failed to generate questions using AI' }, { status: 500 });
  }
}

