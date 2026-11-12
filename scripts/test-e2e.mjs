// Comprehensive E2E Test Suite for PK Assessment Hub
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

let adminCookie = '';
let studentCookie = '';
let createdQuestionId = '';
let createdTestId = '';
let startedAttemptId = '';

async function run() {
  console.log('====================================================');
  console.log('🧪 Starting PK Assessment Hub Comprehensive Test Suite');
  console.log('====================================================\n');

  // Test 1: Admin Login
  console.log('1️⃣ Testing Admin Login...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pk.com', password: 'admin123' }),
  });
  if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${adminLoginRes.status}`);
  adminCookie = adminLoginRes.headers.get('set-cookie') || '';
  const adminData = await adminLoginRes.json();
  console.log('   ✅ Admin logged in:', adminData.user.name, `(${adminData.user.role})`);

  // Test 2: Student Registration & Login
  console.log('\n2️⃣ Testing New Candidate Registration & Login...');
  const testStudentEmail = `testuser_${Date.now()}@pk.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Candidate',
      email: testStudentEmail,
      password: 'password123',
    }),
  });
  if (!regRes.ok) throw new Error(`Student registration failed: ${regRes.status}`);
  studentCookie = regRes.headers.get('set-cookie') || '';
  const regData = await regRes.json();
  if (regData.user.role !== 'USER') throw new Error(`Expected role USER, got ${regData.user.role}`);
  console.log('   ✅ Candidate registered:', regData.user.name, `(${regData.user.email}, role: ${regData.user.role})`);

  // Security Check: Attempt privilege escalation by sending role: "ADMIN"
  console.log('\n🔒 Testing Security: Malicious registration with role: "ADMIN"...');
  const exploitRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Attacker User',
      email: `attacker_${Date.now()}@pk.com`,
      password: 'password123',
      role: 'ADMIN', // Exploitation attempt
    }),
  });
  const exploitData = await exploitRes.json();
  if (exploitData.user.role === 'ADMIN') {
    throw new Error('SECURITY VULNERABILITY: Public registration created an ADMIN account!');
  }
  console.log('   ✅ Privilege escalation prevented: Role assigned is safely', exploitData.user.role);

  // Verify non-admin cannot access admin stats
  const rogueCookie = exploitRes.headers.get('set-cookie') || '';
  const probeAdmin = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { cookie: rogueCookie },
  });
  if (probeAdmin.status !== 403) {
    throw new Error(`SECURITY VULNERABILITY: Non-admin got status ${probeAdmin.status} instead of 403 on admin route!`);
  }
  console.log('   ✅ Admin route protection verified: Non-admin rejected with 403 Forbidden.');

  // Test 3: AI Question Generation
  console.log('\n3️⃣ Testing AI Question Generation Service...');
  const aiRes = await fetch(`${BASE_URL}/api/questions/ai-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify({
      topic: 'Percentage',
      difficulty: 'MEDIUM',
      count: 2,
    }),
  });
  if (!aiRes.ok) throw new Error(`AI question generation failed: ${aiRes.status}`);
  const aiData = await aiRes.json();
  console.log(`   ✅ AI generated ${aiData.questions.length} questions successfully`);
  console.log(`   Sample question: "${aiData.questions[0].question}"`);
  console.log(`   Options: ${JSON.stringify(aiData.questions[0].options)}`);
  console.log(`   Correct answer: ${aiData.questions[0].correctAnswer}`);

  // Test 4: Save Questions (Manual & AI batch)
  console.log('\n4️⃣ Testing Manual Question Creation in Bank...');
  const qRes = await fetch(`${BASE_URL}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify({
      question: 'What is 15% of 200?',
      topic: 'Quantitative Aptitude',
      difficulty: 'EASY',
      options: ['20', '30', '40', '50'],
      correctAnswer: '30',
      explanation: '15% of 200 = (15 / 100) * 200 = 30.',
      marks: 2,
    }),
  });
  if (!qRes.ok) throw new Error(`Create question failed: ${qRes.status}`);
  const qData = await qRes.json();
  createdQuestionId = qData.questions[0].id;
  console.log('   ✅ Question created with ID:', createdQuestionId);

  // Also save the first AI question to bank
  const saveAiRes = await fetch(`${BASE_URL}/api/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify([aiData.questions[0]]),
  });
  if (!saveAiRes.ok) throw new Error(`Saving AI question failed: ${saveAiRes.status}`);
  const savedAiData = await saveAiRes.json();
  const aiQuestionId = savedAiData.questions[0].id;
  console.log('   ✅ AI Question saved to bank with ID:', aiQuestionId);

  // Test 5: Create and Publish Assessment Test
  console.log('\n5️⃣ Testing Test Creation & Publishing...');
  const testRes = await fetch(`${BASE_URL}/api/tests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify({
      title: 'Automated E2E Aptitude Test',
      description: 'End-to-end verification assessment testing all system components.',
      duration: 20,
      questionIds: [createdQuestionId, aiQuestionId],
      status: 'PUBLISHED',
    }),
  });
  if (!testRes.ok) throw new Error(`Create test failed: ${testRes.status}`);
  const testData = await testRes.json();
  createdTestId = testData.test.id;
  console.log('   ✅ Test created and published:', testData.test.title, `(ID: ${createdTestId}, Total Marks: ${testData.test.totalMarks})`);

  // Test 6: Student Views Available Tests
  console.log('\n6️⃣ Testing Student Dashboard Test Retrieval...');
  const studentTestsRes = await fetch(`${BASE_URL}/api/tests`, {
    headers: { cookie: studentCookie },
  });
  if (!studentTestsRes.ok) throw new Error(`Student tests fetch failed: ${studentTestsRes.status}`);
  const studentTestsData = await studentTestsRes.json();
  const matched = studentTestsData.tests.find((t) => t.id === createdTestId);
  if (!matched) throw new Error('Published test not visible to student dashboard!');
  console.log(`   ✅ Test visible on student dashboard. Status: ${matched.userAttemptStatus}`);

  // Test 7: Student Starts Assessment Test
  console.log('\n7️⃣ Testing Student Assessment Start Session...');
  const startRes = await fetch(`${BASE_URL}/api/attempts/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: studentCookie,
    },
    body: JSON.stringify({ testId: createdTestId }),
  });
  if (!startRes.ok) throw new Error(`Start attempt failed: ${startRes.status}`);
  const startData = await startRes.json();
  startedAttemptId = startData.attemptId;
  console.log('   ✅ Assessment session started. Attempt ID:', startedAttemptId);
  console.log(`   Questions loaded: ${startData.questions.length}, Duration: ${startData.duration} mins`);

  // Verify options are present and correctAnswer is hidden from candidate
  const firstQ = startData.questions[0];
  if (firstQ.correctAnswer) throw new Error('Security flaw: Correct answer exposed to student!');
  console.log('   🔒 Security check passed: correctAnswer is properly hidden from test payload.');

  // Test 8: Auto-saving Candidate Answers
  console.log('\n8️⃣ Testing Real-Time Auto-Save Answers...');
  const saveAnswerRes = await fetch(`${BASE_URL}/api/attempts/${startedAttemptId}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: studentCookie,
    },
    body: JSON.stringify({
      questionId: createdQuestionId,
      selectedAnswer: '30', // Correct answer
    }),
  });
  if (!saveAnswerRes.ok) throw new Error(`Auto-save answer failed: ${saveAnswerRes.status}`);
  console.log('   ✅ Answer successfully auto-saved for question 1 ("30").');

  // Test 9: Submitting Assessment & Automatic Evaluation
  console.log('\n9️⃣ Testing Test Submission & Automatic Score Evaluation...');
  const submitRes = await fetch(`${BASE_URL}/api/attempts/${startedAttemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: studentCookie,
    },
    body: JSON.stringify({
      answers: {
        [createdQuestionId]: '30', // Correct (+2 marks)
        [aiQuestionId]: aiData.questions[0].correctAnswer, // Correct (+1 mark)
      },
    }),
  });
  if (!submitRes.ok) throw new Error(`Test submission failed: ${submitRes.status}`);
  const submitData = await submitRes.json();
  console.log('   ✅ Test evaluated successfully:');
  console.log(`      Score: ${submitData.result.score} / ${submitData.result.totalMarks}`);
  console.log(`      Percentage: ${submitData.result.percentage}%`);
  console.log(`      Correct: ${submitData.result.correctCount}, Wrong: ${submitData.result.wrongCount}, Skipped: ${submitData.result.unansweredCount}`);

  // Test 10: Candidate Views Comprehensive Result Breakdown
  console.log('\n🔟 Testing Detailed Result Breakdown Retrieval...');
  const resultRes = await fetch(`${BASE_URL}/api/attempts/${startedAttemptId}`, {
    headers: { cookie: studentCookie },
  });
  if (!resultRes.ok) throw new Error(`Result fetch failed: ${resultRes.status}`);
  const resultData = await resultRes.json();
  console.log(`   ✅ Detailed results retrieved. Time taken: ${resultData.attempt.timeTaken}`);
  console.log(`   Question 1 evaluation:`, resultData.attempt.answers[0].isCorrect ? 'CORRECT' : 'INCORRECT');
  console.log(`   Explanation:`, resultData.attempt.answers[0].explanation);

  // Test 11: Admin Verifies Results & Overview Stats
  console.log('\n1️⃣1️⃣ Testing Admin Overview & Candidate Audit Log...');
  const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { cookie: adminCookie },
  });
  const adminStats = await adminStatsRes.json();
  console.log('   ✅ Admin stats updated:');
  console.log(`      Total Users: ${adminStats.stats.totalUsers}`);
  console.log(`      Total Questions: ${adminStats.stats.totalQuestions}`);
  console.log(`      Total Tests: ${adminStats.stats.totalTests}`);
  console.log(`      Total Attempts: ${adminStats.stats.totalAttempts}`);
  console.log(`      Average Percentage: ${adminStats.stats.averagePercentage}%`);

  const adminResultsRes = await fetch(`${BASE_URL}/api/admin/results`, {
    headers: { cookie: adminCookie },
  });
  const adminResults = await adminResultsRes.json();
  const latestResult = adminResults.results.find((r) => r.id === startedAttemptId);
  if (!latestResult) throw new Error('Attempt not found in admin results audit list!');
  console.log(`   ✅ Admin results table verified candidate ${latestResult.userName} scored ${latestResult.score}/${latestResult.totalMarks}.`);

  console.log('\n====================================================');
  console.log('🎉 ALL 11 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
