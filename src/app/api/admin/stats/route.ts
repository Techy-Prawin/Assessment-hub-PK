import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [totalUsers, totalTests, totalQuestions, totalAttempts, attempts] =
      await Promise.all([
        prisma.user.count(),
        prisma.test.count(),
        prisma.question.count(),
        prisma.testAttempt.count({ where: { status: 'COMPLETED' } }),
        prisma.testAttempt.findMany({
          where: { status: 'COMPLETED' },
          select: { score: true, percentage: true },
        }),
      ]);

    const averagePercentage =
      attempts.length > 0
        ? Number(
            (
              attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length
            ).toFixed(1)
          )
        : 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTests,
        totalQuestions,
        totalAttempts,
        averagePercentage,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}

