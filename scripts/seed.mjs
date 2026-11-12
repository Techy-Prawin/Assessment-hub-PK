import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for PK Assessment Hub...');

  // 1. Create or update Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pk.com' },
    update: {},
    create: {
      name: 'Administrator PK',
      email: 'admin@pk.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user ready:', admin.email);

  // 2. Create or update Student
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@pk.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'student@pk.com',
      password: studentPassword,
      role: 'USER',
    },
  });
  console.log('Demo Student ready:', student.email);

  // 3. Seed starter question bank
  const starterQuestions = [
    {
      question: 'A fruit seller had some apples. He sells 40% apples and still has 420 apples. Originally, he had how many apples?',
      topic: 'Quantitative Aptitude',
      difficulty: 'MEDIUM',
      options: JSON.stringify(['588', '600', '672', '700']),
      correctAnswer: '700',
      explanation: 'Suppose originally he had x apples. Remaining = (100 - 40)% of x = 60% of x. So (60/100)*x = 420 => x = (420 * 100) / 60 = 700.',
      marks: 1,
    },
    {
      question: 'If A is the brother of B; B is the sister of C; and C is the father of D, how is D related to A?',
      topic: 'Logical Reasoning',
      difficulty: 'MEDIUM',
      options: JSON.stringify(['Brother', 'Nephew / Niece', 'Sister', 'Uncle']),
      correctAnswer: 'Nephew / Niece',
      explanation: 'A, B and C are siblings. D is the child of C. Therefore, D is the nephew or niece of A.',
      marks: 1,
    },
    {
      question: 'Choose the word that is most nearly opposite in meaning (Antonym) to "TRANSIENT":',
      topic: 'Verbal Ability',
      difficulty: 'EASY',
      options: JSON.stringify(['Permanent', 'Brief', 'Fugitive', 'Temporary']),
      correctAnswer: 'Permanent',
      explanation: '"Transient" means lasting only for a short time; impermanent. The exact antonym is "Permanent".',
      marks: 1,
    },
    {
      question: 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
      topic: 'Quantitative Aptitude',
      difficulty: 'HARD',
      options: JSON.stringify(['120 metres', '150 metres', '180 metres', '324 metres']),
      correctAnswer: '150 metres',
      explanation: 'Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length of train = Speed * Time = (50/3) * 9 = 150 metres.',
      marks: 1,
    },
    {
      question: 'In object-oriented programming, which principle allows a child class to provide a specific implementation of a method that is already provided by its parent class?',
      topic: 'Programming',
      difficulty: 'EASY',
      options: JSON.stringify(['Method Overriding (Polymorphism)', 'Encapsulation', 'Abstraction', 'Data Hiding']),
      correctAnswer: 'Method Overriding (Polymorphism)',
      explanation: 'Method overriding enables runtime polymorphism, allowing subclasses to override inherited methods.',
      marks: 1,
    },
    {
      question: 'Find the missing number in the series: 7, 10, 8, 11, 9, 12, ...?',
      topic: 'Logical Reasoning',
      difficulty: 'EASY',
      options: JSON.stringify(['7', '10', '12', '13']),
      correctAnswer: '10',
      explanation: 'It is an alternating addition and subtraction series: +3, -2, +3, -2, +3, -2. So 12 - 2 = 10.',
      marks: 1,
    },
  ];

  const createdQuestions = [];
  for (const q of starterQuestions) {
    const existing = await prisma.question.findFirst({ where: { question: q.question } });
    if (!existing) {
      const item = await prisma.question.create({ data: q });
      createdQuestions.push(item);
    } else {
      createdQuestions.push(existing);
    }
  }
  console.log(`Question bank ready with ${createdQuestions.length} questions.`);

  // 4. Create a Sample Published Test if none exists
  const existingTest = await prisma.test.findFirst({
    where: { title: 'Aptitude Practice Test 1' },
  });

  if (!existingTest) {
    const test = await prisma.test.create({
      data: {
        title: 'Aptitude Practice Test 1',
        description: 'Comprehensive assessment covering Quantitative Aptitude, Logical Reasoning, and Verbal Ability fundamentals.',
        duration: 15, // 15 mins
        totalMarks: 5,
        status: 'PUBLISHED',
      },
    });

    // Link the first 5 questions
    for (let i = 0; i < Math.min(5, createdQuestions.length); i++) {
      await prisma.testQuestion.create({
        data: {
          testId: test.id,
          questionId: createdQuestions[i].id,
          order: i + 1,
        },
      });
    }
    console.log('Sample test created and published with 5 questions:', test.title);
  }

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

