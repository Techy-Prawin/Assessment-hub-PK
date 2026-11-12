import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId } = await req.json();
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        testQuestions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.status !== 'PUBLISHED' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'This test is currently not available' }, { status: 403 });
    }

    if (test.testQuestions.length === 0) {
      return NextResponse.json({ error: 'This test has no questions yet' }, { status: 400 });
    }

    // Check if user already has an IN_PROGRESS attempt
    let attempt = await prisma.testAttempt.findFirst({
      where: {
        testId: test.id,
        userId: user.userId,
        status: 'IN_PROGRESS',
      },
      include: {
        answers: true,
      },
    });

    // Check if the in-progress attempt has timed out
    if (attempt) {
      const now = new Date().getTime();
      const startTime = new Date(attempt.startedAt).getTime();
      const maxDurationMs = (test.duration + 1) * 60 * 1000; // 1 min grace buffer

      if (now - startTime > maxDurationMs) {
        // Mark as EXPIRED/COMPLETED
        await prisma.testAttempt.update({
          where: { id: attempt.id },
          data: { status: 'EXPIRED', submittedAt: new Date() },
        });
        attempt = null; // force new attempt if allowed
      }
    }

    // Create a new attempt if none in-progress
    if (!attempt) {
      attempt = await prisma.testAttempt.create({
        data: {
          testId: test.id,
          userId: user.userId,
          startedAt: new Date(),
          totalQuestions: test.testQuestions.length,
          status: 'IN_PROGRESS',
        },
        include: {
          answers: true,
        },
      });
    }

    // Prepare questions without giving away correct answers
    const questions = test.testQuestions.map((tq) => ({
      id: tq.question.id,
      question: tq.question.question,
      topic: tq.question.topic,
      difficulty: tq.question.difficulty,
      marks: tq.question.marks,
      options: JSON.parse(tq.question.options),
      order: tq.order,
    }));

    // Map existing saved answers
    const savedAnswersMap: Record<string, string> = {};
    for (const ans of attempt.answers) {
      if (ans.selectedAnswer) {
        savedAnswersMap[ans.questionId] = ans.selectedAnswer;
      }
    }

    return NextResponse.json({
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      duration: test.duration,
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
      },
      questions,
      savedAnswers: savedAnswersMap,
    });
  } catch (error: any) {
    console.error('Error starting test attempt:', error);
    return NextResponse.json({ error: 'Failed to start test attempt' }, { status: 500 });
  }
}

