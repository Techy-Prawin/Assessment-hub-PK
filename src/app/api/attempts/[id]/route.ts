import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id },
      include: {
        test: {
          include: {
            testQuestions: {
              include: { question: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Only allow author or admin
    if (attempt.userId !== user.userId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access to this result' }, { status: 403 });
    }

    // Format answers with questions
    const detailedAnswers = attempt.test.testQuestions.map((tq) => {
      const q = tq.question;
      const userAns = attempt.answers.find((a) => a.questionId === q.id);

      return {
        questionId: q.id,
        question: q.question,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        options: JSON.parse(q.options),
        selectedAnswer: userAns?.selectedAnswer || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect: userAns?.isCorrect ?? false,
        marksAwarded: userAns?.marksAwarded ?? 0,
        aiFeedback: userAns?.aiFeedback || null,
      };
    });

    // Compute duration taken in minutes and seconds
    let timeTakenFormatted = 'N/A';
    if (attempt.startedAt && attempt.submittedAt) {
      const diffMs =
        new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime();
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      timeTakenFormatted = `${mins}m ${secs}s`;
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        testId: attempt.testId,
        testTitle: attempt.test.title,
        testDescription: attempt.test.description,
        totalMarks: attempt.test.totalMarks,
        score: attempt.score,
        percentage: attempt.percentage,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        unansweredCount: attempt.unansweredCount,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeTaken: timeTakenFormatted,
        status: attempt.status,
        user: attempt.user,
        answers: detailedAnswers,
      },
    });
  } catch (error: any) {
    console.error('Error fetching attempt result:', error);
    return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 });
  }
}

