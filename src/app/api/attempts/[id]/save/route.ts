import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionId, selectedAnswer } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    // Verify attempt ownership and status
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id },
    });

    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Test attempt has already been submitted' }, { status: 400 });
    }

    // Upsert user answer
    const saved = await prisma.userAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId,
        },
      },
      update: {
        selectedAnswer: selectedAnswer !== undefined ? selectedAnswer : null,
      },
      create: {
        attemptId: attempt.id,
        questionId,
        selectedAnswer: selectedAnswer !== undefined ? selectedAnswer : null,
      },
    });

    return NextResponse.json({
      success: true,
      answer: saved,
    });
  } catch (error: any) {
    console.error('Error auto-saving answer:', error);
    return NextResponse.json({ error: 'Failed to auto-save answer' }, { status: 500 });
  }
}

