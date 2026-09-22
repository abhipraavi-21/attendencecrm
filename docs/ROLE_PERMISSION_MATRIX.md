# Role Permission Matrix

| Module | Super Admin | HR/Admin | Manager | Employee | Accountant |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Full | HR view | Team view | Self view | Payroll view |
| Employees | Full | Manage | Team read | Self read | Salary/payroll read |
| Attendance | Full | Manual/corrections | Team approvals | Self check-in/out | Reports |
| Leave | Full | Final approval | Manager approval | Request/cancel | Read payroll impact |
| Projects/Tasks | Full | Manage | Manage team | Assigned work | Read summaries |
| Daily Reports | Full | Read | Review team | Submit | Read summaries |
| Payroll | Full | Restricted | No salary | No salary | Full payroll summary |
| Settings | Full | Policy settings | No | No | No |
| Audit Logs | Full | Read important logs | No | No | No |

All protected API routes enforce permissions server-side. Navigation hiding is only a convenience.
