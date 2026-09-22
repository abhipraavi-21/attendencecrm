export function minutesBetween(start, end) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(diff / 60000));
}

export function sumBreakMinutes(breaks) {
  return breaks.reduce((total, item) => {
    if (!item.endAt) return total;
    return total + minutesBetween(item.startAt, item.endAt);
  }, 0);
}

export function calculateAttendance({ checkInAt, checkOutAt, breaks = [], policy }) {
  if (!checkInAt || !checkOutAt) {
    return {
      workedMinutes: 0,
      breakMinutes: sumBreakMinutes(breaks),
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      status: "MISSED_CHECKOUT",
    };
  }

  const grossMinutes = minutesBetween(checkInAt, checkOutAt);
  const breakMinutes = sumBreakMinutes(breaks);
  const workedMinutes = Math.max(0, grossMinutes - breakMinutes);
  const checkIn = new Date(checkInAt);
  const checkOut = new Date(checkOutAt);
  const [startHour, startMinute] = policy.officeStart.split(":").map(Number);
  const [endHour, endMinute] = policy.officeEnd.split(":").map(Number);
  const officeStart = new Date(checkIn);
  officeStart.setHours(startHour, startMinute + policy.graceMinutes, 0, 0);
  const officeEnd = new Date(checkIn);
  officeEnd.setHours(endHour, endMinute, 0, 0);
  if (officeEnd <= officeStart) officeEnd.setDate(officeEnd.getDate() + 1);

  const lateMinutes = Math.max(0, minutesBetween(officeStart, checkIn));
  const earlyDepartureMinutes = Math.max(0, minutesBetween(checkOut, officeEnd));
  const overtimeMinutes = Math.max(0, workedMinutes - policy.fullDayMinutes);
  const status =
    workedMinutes >= policy.fullDayMinutes
      ? "PRESENT"
      : workedMinutes >= policy.halfDayMinutes
        ? "HALF_DAY"
        : "ABSENT";

  return { workedMinutes, breakMinutes, overtimeMinutes, lateMinutes, earlyDepartureMinutes, status };
}

export function hasOverlappingRange(existing, candidate) {
  const start = new Date(candidate.startAt).getTime();
  const end = new Date(candidate.endAt).getTime();
  return existing.some((item) => {
    const itemStart = new Date(item.startAt).getTime();
    const itemEnd = new Date(item.endAt).getTime();
    return start < itemEnd && end > itemStart;
  });
}

export function calculateLeaveDays({ from, to, halfDay = false, holidays = [], weeklyOffDays = [0, 6] }) {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  const holidaySet = new Set(holidays.map((date) => new Date(date).toISOString().slice(0, 10)));
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    if (!weeklyOffDays.includes(cursor.getDay()) && !holidaySet.has(key)) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return halfDay ? Math.min(days, 0.5) : days;
}

export function payrollSummary(records, leaveRequests) {
  const paidLeave = leaveRequests
    .filter((item) => item.status === "APPROVED" && item.paid)
    .reduce((sum, item) => sum + item.days, 0);
  const unpaidLeave = leaveRequests
    .filter((item) => item.status === "APPROVED" && !item.paid)
    .reduce((sum, item) => sum + item.days, 0);
  const presentDays = records.filter((item) => item.status === "PRESENT").length;
  const halfDays = records.filter((item) => item.status === "HALF_DAY").length;
  const overtimeMinutes = records.reduce((sum, item) => sum + (item.overtimeMinutes || 0), 0);
  const lateMarks = records.filter((item) => (item.lateMinutes || 0) > 0).length;
  return {
    presentDays,
    paidLeave,
    unpaidLeave,
    halfDays,
    overtimeMinutes,
    lateMarks,
    payableDays: presentDays + paidLeave + halfDays * 0.5,
  };
}
