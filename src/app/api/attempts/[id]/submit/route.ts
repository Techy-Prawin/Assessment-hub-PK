import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { evaluateAnswerWithAI } from '@/lib/ai';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const answersMap: Record<string, string> = body.answers || {};

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
        answers: true,
      },
    });

    if (!attempt || attempt.userId !== user.userId) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 });
    }

    if (attempt.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Attempt already completed',
        attemptId: attempt.id,
      });
    }

    const test = attempt.test;
    const questions = test.testQuestions.map((tq) => tq.question);

    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    // Evaluate each question
    for (const q of questions) {
      // Find selected answer either from submitted map or previously auto-saved DB answer
      const existingDbAnswer = attempt.answers.find((a) => a.questionId === q.id);
      const chosen = answersMap[q.id] !== undefined ? answersMap[q.id] : existingDbAnswer?.selectedAnswer;

      if (!chosen || chosen.trim().length === 0) {
        unansweredCount++;
        await prisma.userAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: q.id,
            },
          },
          update: {
            selectedAnswer: null,
            isCorrect: false,
            marksAwarded: 0,
            aiFeedback: 'Unanswered question.',
          },
          create: {
            attemptId: attempt.id,
            questionId: q.id,
            selectedAnswer: null,
            isCorrect: false,
            marksAwarded: 0,
            aiFeedback: 'Unanswered question.',
          },
        });
      } else {
        const isCorrect = chosen.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        const marksAwarded = isCorrect ? q.marks : 0;

        if (isCorrect) {
          correctCount++;
          totalScore += marksAwarded;
        } else {
          wrongCount++;
        }

        await prisma.userAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: q.id,
            },
          },
          update: {
            selectedAnswer: chosen,
            isCorrect,
            marksAwarded,
            aiFeedback: isCorrect
              ? 'Correct answer.'
              : `Incorrect. Correct answer was: ${q.correctAnswer}.`,
          },
          create: {
            attemptId: attempt.id,
            questionId: q.id,
            selectedAnswer: chosen,
            isCorrect,
            marksAwarded,
            aiFeedback: isCorrect
              ? 'Correct answer.'
              : `Incorrect. Correct answer was: ${q.correctAnswer}.`,
          },
        });
      }
    }

    const totalPossibleMarks = test.totalMarks > 0 ? test.totalMarks : questions.length;
    const percentage = Number(((totalScore / totalPossibleMarks) * 100).toFixed(1));

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        score: totalScore,
        correctCount,
        wrongCount,
        unansweredCount,
        percentage,
        submittedAt: new Date(),
        status: 'COMPLETED',
      },
      include: {
        answers: {
          include: { question: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        attemptId: updatedAttempt.id,
        score: updatedAttempt.score,
        totalMarks: totalPossibleMarks,
        correctCount: updatedAttempt.correctCount,
        wrongCount: updatedAttempt.wrongCount,
        unansweredCount: updatedAttempt.unansweredCount,
        percentage: updatedAttempt.percentage,
        submittedAt: updatedAttempt.submittedAt,
        status: updatedAttempt.status,
      },
    });
  } catch (error: any) {
    console.error('Error submitting test:', error);
    return NextResponse.json({ error: 'Failed to evaluate and submit test' }, { status: 500 });
  }
}

