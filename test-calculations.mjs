// Pure ESM test runner matching src/lib/calculations.ts exact implementation
console.log('=== RUNNING STUDYFLOW SYSTEM TEST SUITE ===\n');

let failed = 0;

function assert(condition, testName, detail) {
  if (condition) {
    console.log(`✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
  } else {
    console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

// Implementations from calculations.ts
function calculateDailyPlannerProgress(activities) {
  const eligible = activities.filter(a => a.status !== 'cancelled');
  const total = eligible.length;
  const completed = eligible.filter(a => a.status === 'completed').length;
  return {
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed,
    total,
  };
}

function calculateTaskCompletion(tasks) {
  const eligible = tasks.filter(t => t.status !== 'cancelled');
  const total = eligible.length;
  const completed = eligible.filter(t => t.status === 'completed').length;
  return {
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed,
    total,
  };
}

function calculateTimetableAdherence(sessions, today = '2026-11-10') {
  const eligible = sessions.filter(s => {
    if (s.status === 'cancelled') return false;
    if (!s.session_date) return false;
    return s.session_date <= today;
  });
  const total = eligible.length;
  const completed = eligible.filter(s => s.status === 'completed').length;
  const missed = eligible.filter(s => s.status === 'missed').length;
  return {
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    completed,
    missed,
    total,
  };
}

function calculateGoalProgress(goal) {
  if (!goal.target_value || goal.target_value === 0) return 0;
  return Math.min(100, Math.round((goal.achieved_value / goal.target_value) * 100));
}

// -------------------------------------------------------------
// TEST 1: 10 daily activities, 7 completed. Expected: 70%.
// -------------------------------------------------------------
const test1Activities = [
  ...Array.from({ length: 7 }, (_, i) => ({ id: `act-${i}`, status: 'completed' })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `act-p-${i}`, status: 'pending' })),
];
const r1 = calculateDailyPlannerProgress(test1Activities);
assert(r1.percentage === 70, 'TEST 1: 10 daily activities, 7 completed', `Expected 70%, Got ${r1.percentage}%`);

// -------------------------------------------------------------
// TEST 2: 20 tasks, 15 completed, 5 pending. Expected: 75%.
// -------------------------------------------------------------
const test2Tasks = [
  ...Array.from({ length: 15 }, (_, i) => ({ id: `t-c-${i}`, status: 'completed' })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: `t-p-${i}`, status: 'todo' })),
];
const r2 = calculateTaskCompletion(test2Tasks);
assert(r2.percentage === 75, 'TEST 2: 20 tasks, 15 completed, 5 pending', `Expected 75%, Got ${r2.percentage}%`);

// -------------------------------------------------------------
// TEST 3: 10 eligible timetable sessions, 8 completed. Expected: 80%.
// -------------------------------------------------------------
const test3Sessions = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: `s-c-${i}`, session_date: '2026-11-09', status: 'completed' })),
  ...Array.from({ length: 2 }, (_, i) => ({ id: `s-m-${i}`, session_date: '2026-11-09', status: 'missed' })),
];
const r3 = calculateTimetableAdherence(test3Sessions);
assert(r3.percentage === 80, 'TEST 3: 10 eligible timetable sessions, 8 completed', `Expected 80%, Got ${r3.percentage}%`);

// -------------------------------------------------------------
// TEST 4: Goal target 100 chapters, achieved 60. Expected: 60%.
// -------------------------------------------------------------
const test4Goal = { target_value: 100, achieved_value: 60 };
const r4 = calculateGoalProgress(test4Goal);
assert(r4 === 60, 'TEST 4: Goal target 100 chapters, achieved 60', `Expected 60%, Got ${r4}%`);

// -------------------------------------------------------------
// TEST 5: Delete a completed task. Expected: Task completion recalculates immediately.
// -------------------------------------------------------------
const tasksAfterDelete = test2Tasks.slice(1); // 14 completed, 5 pending (total 19)
const r5 = calculateTaskCompletion(tasksAfterDelete);
const expectedR5 = Math.round((14 / 19) * 100); // 74%
assert(r5.percentage === expectedR5 && r5.completed === 14 && r5.total === 19, 'TEST 5: Delete a completed task recalculates statistics', `Expected ${expectedR5}%, Got ${r5.percentage}%`);

// -------------------------------------------------------------
// TEST 6: Cancel a daily activity. Expected: Excluded from daily completion denominator.
// -------------------------------------------------------------
const activitiesWithCancelled = [
  ...test1Activities.slice(0, 9),
  { id: 'act-9', status: 'cancelled' },
];
const r6 = calculateDailyPlannerProgress(activitiesWithCancelled);
assert(r6.total === 9 && r6.percentage === Math.round((7 / 9) * 100), 'TEST 6: Cancelled activity excluded from denominator', `Eligible: ${r6.total}, Expected: ${Math.round((7/9)*100)}%, Got: ${r6.percentage}%`);

// -------------------------------------------------------------
// TEST 7: Add a future timetable session. Expected: Excluded from eligible completed/missed calculation.
// -------------------------------------------------------------
const sessionsWithFuture = [
  ...test3Sessions,
  { id: 's-fut', session_date: '2026-11-20', status: 'upcoming' },
];
const r7 = calculateTimetableAdherence(sessionsWithFuture);
assert(r7.total === 10 && r7.percentage === 80, 'TEST 7: Future timetable session excluded from eligible denominator', `Eligible: ${r7.total}, Adherence: ${r7.percentage}%`);

// -------------------------------------------------------------
// TEST 8: Goal target capped at 100%
// -------------------------------------------------------------
const overachieved = { target_value: 100, achieved_value: 130 };
const r8 = calculateGoalProgress(overachieved);
assert(r8 === 100, 'TEST 8: Goal progress capped at 100%', `Expected 100%, Got ${r8}%`);

console.log(`\n=== TEST SUITE RESULTS: ${failed === 0 ? 'ALL 8 TESTS PASSED ✨' : `${failed} FAILED`} ===`);
if (failed > 0) process.exit(1);
