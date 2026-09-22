# Main Workflows

## Attendance

Employees check in, optionally start/end breaks, and check out. The server prevents duplicate active check-ins, checkout without check-in, and multiple active breaks. Worked time, break time, late marks, early departure, half-day, and overtime are calculated server-side from policy settings.

## Leave

Employees submit leave requests. The server rejects overlapping active requests and calculates working days from the date range. Managers can approve to HR, HR/Admin can approve or reject finally, and comments are kept in history.

## Daily Reports

Employees submit one daily work report per date with project/task context, work completed, pending work, blockers, time spent, links, and next plan. Managers can review these records in the seeded dashboard data model.

## Payroll-Ready Summary

Attendance records and approved leave requests feed payable days, paid leave, unpaid leave, half-days, overtime, and late marks. Payroll finalization should lock monthly summaries after accountant review.
