import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const attempts = await prisma.testAttempt.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        test: { select: { id: true, title: true, totalMarks: true } },
      },
    });

    const formatted = attempts.map((a) => ({
      id: a.id,
      userName: a.user.name,
      userEmail: a.user.email,
      testTitle: a.test.title,
      testId: a.test.id,
      score: a.score,
      totalMarks: a.test.totalMarks,
      percentage: a.percentage,
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      unansweredCount: a.unansweredCount,
      status: a.status,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
    }));

    return NextResponse.json({ results: formatted });
  } catch (error: any) {
    console.error('Error fetching admin results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

