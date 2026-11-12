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

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        testQuestions: {
          include: {
            question: true,
          },
          orderBy: { order: 'asc' },
        },
        attempts: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const isAdmin = user.role === 'ADMIN';

    // Format questions: Hide correctAnswer and explanation for non-admins unless taking test / reviewing
    const formattedQuestions = test.testQuestions.map((tq) => {
      const q = tq.question;
      return {
        id: q.id,
        question: q.question,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        options: JSON.parse(q.options),
        order: tq.order,
        ...(isAdmin
          ? {
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
            }
          : {}),
      };
    });

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        status: test.status,
        createdAt: test.createdAt,
        questionsCount: formattedQuestions.length,
        questions: formattedQuestions,
        attempts: isAdmin ? test.attempts : undefined,
      },
    });
  } catch (error: any) {
    console.error('Error fetching test:', error);
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { title, description, duration, status, questionIds } = await req.json();

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (duration !== undefined) updateData.duration = Number(duration);
    if (status !== undefined) updateData.status = status;

    if (Array.isArray(questionIds)) {
      // Re-link questions
      await prisma.testQuestion.deleteMany({
        where: { testId: params.id },
      });

      const dbQuestions = await prisma.question.findMany({
        where: { id: { in: questionIds } },
      });
      updateData.totalMarks = dbQuestions.reduce((acc, q) => acc + q.marks, 0);

      for (let i = 0; i < questionIds.length; i++) {
        await prisma.testQuestion.create({
          data: {
            testId: params.id,
            questionId: questionIds[i],
            order: i + 1,
          },
        });
      }
    }

    const updated = await prisma.test.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, test: updated });
  } catch (error: any) {
    console.error('Error updating test:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await prisma.test.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Test deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting test:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}

