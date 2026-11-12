import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    const where: any = {};
    if (topic && topic !== 'ALL') {
      where.topic = topic;
    }
    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = difficulty.toUpperCase();
    }
    if (search) {
      where.question = { contains: search };
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));

    return NextResponse.json({ questions: formatted });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();

    // Check if body is an array (batch insert from AI review) or single question
    const questionsToCreate = Array.isArray(body) ? body : [body];

    const results = [];
    for (const item of questionsToCreate) {
      const { question, topic, difficulty, options, correctAnswer, explanation, marks } = item;

      if (!question || !topic || !options || !correctAnswer) {
        return NextResponse.json({ error: 'Missing required question fields' }, { status: 400 });
      }

      const optionsArray = Array.isArray(options) ? options : JSON.parse(options);
      if (optionsArray.length < 2) {
        return NextResponse.json({ error: 'At least 2 options required' }, { status: 400 });
      }

      const created = await prisma.question.create({
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

      results.push({
        ...created,
        options: optionsArray,
      });
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      questions: results,
    });
  } catch (error: any) {
    console.error('Error saving question(s):', error);
    return NextResponse.json({ error: 'Failed to create question(s)' }, { status: 500 });
  }
}

