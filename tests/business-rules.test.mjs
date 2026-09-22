import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAttendance,
  calculateLeaveDays,
  hasOverlappingRange,
  payrollSummary,
  sumBreakMinutes,
} from "../src/lib/business-rules.js";

const policy = {
  officeStart: "09:30",
  officeEnd: "18:30",
  graceMinutes: 10,
  fullDayMinutes: 480,
  halfDayMinutes: 240,
};

test("attendance calculates worked time, breaks, and overtime", () => {
  const result = calculateAttendance({
    checkInAt: "2026-09-22T04:15:00.000Z",
    checkOutAt: "2026-09-22T13:30:00.000Z",
    breaks: [{ startAt: "2026-09-22T08:00:00.000Z", endAt: "2026-09-22T08:30:00.000Z" }],
    policy,
  });
  assert.equal(result.workedMinutes, 525);
  assert.equal(result.breakMinutes, 30);
  assert.equal(result.status, "PRESENT");
  assert.equal(result.overtimeMinutes, 45);
});

test("missed checkout is not marked present", () => {
  const result = calculateAttendance({ checkInAt: "2026-09-22T04:00:00.000Z", breaks: [], policy });
  assert.equal(result.status, "MISSED_CHECKOUT");
  assert.equal(result.workedMinutes, 0);
});

test("break durations and overlap detection work", () => {
  const breaks = [{ startAt: "2026-09-22T08:00:00.000Z", endAt: "2026-09-22T08:20:00.000Z" }];
  assert.equal(sumBreakMinutes(breaks), 20);
  assert.equal(hasOverlappingRange(breaks, { startAt: "2026-09-22T08:10:00.000Z", endAt: "2026-09-22T08:30:00.000Z" }), true);
});

test("leave days skip weekly offs and support half day", () => {
  assert.equal(calculateLeaveDays({ from: "2026-09-21", to: "2026-09-27", holidays: ["2026-09-23"] }), 4);
  assert.equal(calculateLeaveDays({ from: "2026-09-21", to: "2026-09-21", halfDay: true }), 0.5);
});

test("payroll summary derives payable days", () => {
  const summary = payrollSummary(
    [
      { status: "PRESENT", overtimeMinutes: 30, lateMinutes: 0 },
      { status: "HALF_DAY", overtimeMinutes: 0, lateMinutes: 10 },
    ],
    [
      { status: "APPROVED", paid: true, days: 1 },
      { status: "APPROVED", paid: false, days: 2 },
    ],
  );
  assert.equal(summary.payableDays, 2.5);
  assert.equal(summary.unpaidLeave, 2);
  assert.equal(summary.lateMarks, 1);
});
