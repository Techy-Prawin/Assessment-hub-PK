import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.role === 'ADMIN';

    if (isAdmin) {
      const tests = await prisma.test.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          testQuestions: {
            include: {
              question: true,
            },
            orderBy: { order: 'asc' },
          },
          attempts: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      const formatted = tests.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        duration: t.duration,
        totalMarks: t.totalMarks,
        status: t.status,
        createdAt: t.createdAt,
        questionsCount: t.testQuestions.length,
        attemptsCount: t.attempts.length,
        averageScore:
          t.attempts.length > 0
            ? Number(
                (
                  t.attempts.reduce((acc, curr) => acc + curr.score, 0) /
                  t.attempts.length
                ).toFixed(1)
              )
            : 0,
        questions: t.testQuestions.map((tq) => ({
          ...tq.question,
          options: JSON.parse(tq.question.options),
        })),
      }));

      return NextResponse.json({ tests: formatted });
    } else {
      // For regular students: show published tests with their attempt status
      const tests = await prisma.test.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        include: {
          testQuestions: true,
          attempts: {
            where: { userId: user.userId },
            orderBy: { startedAt: 'desc' },
          },
        },
      });

      const formatted = tests.map((t) => {
        const latestAttempt = t.attempts[0];
        let attemptStatus: 'AVAILABLE' | 'COMPLETED' | 'IN_PROGRESS' = 'AVAILABLE';

        if (latestAttempt) {
          if (latestAttempt.status === 'COMPLETED' || latestAttempt.status === 'EXPIRED') {
            attemptStatus = 'COMPLETED';
          } else if (latestAttempt.status === 'IN_PROGRESS') {
            attemptStatus = 'IN_PROGRESS';
          }
        }

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          duration: t.duration,
          totalMarks: t.totalMarks,
          status: t.status,
          createdAt: t.createdAt,
          questionsCount: t.testQuestions.length,
          userAttemptStatus: attemptStatus,
          latestAttempt: latestAttempt
            ? {
                id: latestAttempt.id,
                score: latestAttempt.score,
                percentage: latestAttempt.percentage,
                submittedAt: latestAttempt.submittedAt,
                status: latestAttempt.status,
              }
            : null,
        };
      });

      return NextResponse.json({ tests: formatted });
    }
  } catch (error: any) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { title, description, duration, questionIds, status = 'PUBLISHED' } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Test title is required' }, { status: 400 });
    }

    const durationNum = Number(duration) || 30;

    // Fetch questions to compute totalMarks
    let totalMarks = 0;
    const qIds: string[] = Array.isArray(questionIds) ? questionIds : [];

    if (qIds.length > 0) {
      const dbQuestions = await prisma.question.findMany({
        where: { id: { in: qIds } },
      });
      totalMarks = dbQuestions.reduce((acc, q) => acc + q.marks, 0);
    }

    const test = await prisma.test.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        duration: durationNum,
        totalMarks: totalMarks > 0 ? totalMarks : qIds.length,
        status: status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      },
    });

    // Create TestQuestion relationships
    for (let i = 0; i < qIds.length; i++) {
      await prisma.testQuestion.create({
        data: {
          testId: test.id,
          questionId: qIds[i],
          order: i + 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      test: {
        ...test,
        questionsCount: qIds.length,
      },
    });
  } catch (error: any) {
    console.error('Error creating test:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}

