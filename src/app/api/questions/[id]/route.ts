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

    const question = await prisma.question.findUnique({
      where: { id: params.id },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({
      question: {
        ...question,
        options: JSON.parse(question.options),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
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

    const { question, topic, difficulty, options, correctAnswer, explanation, marks } = await req.json();

    const optionsArray = Array.isArray(options) ? options : JSON.parse(options);

    const updated = await prisma.question.update({
      where: { id: params.id },
      data: {
        question: question.trim(),
        topic: topic.trim(),
        difficulty: (difficulty || 'MEDIUM').toUpperCase(),
        options: JSON.stringify(optionsArray),
        correctAnswer: correctAnswer.trim(),
        explanation: explanation ? explanation.trim() : null,
        marks: Number(marks) || 1,
      },
    });

    return NextResponse.json({
      success: true,
      question: {
        ...updated,
        options: optionsArray,
      },
    });
  } catch (error: any) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
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

    await prisma.question.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Question deleted' });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}

