# Attendance Reporting & Analytics API Documentation

This document provides complete details of the newly created read-only reporting endpoints, violation management, and audit logs.

---

### 1. Dashboard Summary
* **Endpoint:** `GET /api/v1/attendance/dashboard/`

* **Filters:**
  * `date` (format: `YYYY-MM-DD`, defaults to today)
  * `branch` (UUID)
  * `batch` (UUID)
  * `faculty` (UUID)
* **Response Sample:**
```json
{
    "success": true,
    "data": {
        "total_students": 2,
        "present_today": 0,
        "absent_today": 0,
        "late_today": 0,
        "attendance_percentage": 0.0,
        "active_violations": 0,
        "faculty_attendance_summary": {
            "total_faculty": 4,
            "present": 0,
            "absent": 4
        },
        "branch_wise_attendance": [
            {
                "branch_id": "ad7c485d-fe6c-4db0-a964-892303accb6b",
                "branch_name": "Gandhinagar",
                "percentage": 0.0
            },
            {
                "branch_id": "dd4b150b-c817-497b-89bf-62729d319b36",
                "branch_name": "Vadodara Insight",
                "percentage": 0.0
            },
           
        ]
    }
}
```

---

### 2. Students Summary List
* **Endpoint:** `GET /api/v1/attendance/students/`
* **Filters:**
  * `student_id`, `enrollment_no`, `branch_id`, `batch_id`, `course_id`
  * `attendance_percentage_min`, `attendance_percentage_max`
  * `date_from`, `date_to` (format: `YYYY-MM-DD`)
  * `late_entries` (`true`/`false`)
  * `active_violations` (`true`/`false`)
  * `search` (name, admission number, roll number)
* **Response Sample:**
```json
{
    "success": true,
    "count": 2,
    "page_size": 50,
    "data": [
        {
            "id": "c86bb891-9026-4d18-a614-ffe771006b49",
            "student_profile": {
                "id": "c86bb891-9026-4d18-a614-ffe771006b49",
                "name": "Tulsi Kerai",
                "roll_number": "",
                "admission_number": "ADM-2026-000002",
                "photo": "https://hrmsknowcraftstorage.blob.core.windows.net/media/onboarding/media/23/documents/kinjal_LXTQKAO.jpeg?se=2026-06-11T12%3A29%3A56Z&sp=r&sv=2026-04-06&sr=b&sig=eaEtdggAo8g7l6DSn8gc/ZsYlADo/2CcdwYTDaRYjzc%3D",
                "branch_name": "Rajkot",
                "batch_name": null
            },
            "attendance_percentage": 100.0,
            "present_count": 1,
            "absent_count": 0,
            "late_count": 0,
            "last_attendance_date": "2026-05-29"
        },
        {
            "id": "020e3605-ca1d-4b3c-8ae9-a84681f9b72d",
            "student_profile": {
                "id": "020e3605-ca1d-4b3c-8ae9-a84681f9b72d",
                "name": "Zeelsh Sonagara",
                "roll_number": "",
                "admission_number": "ADM-2026-000001",
                "photo": "https://hrmsknowcraftstorage.blob.core.windows.net/media/onboarding/media/24/documents/anand_XB2Q3jh.jpeg?se=2026-06-11T12%3A29%3A56Z&sp=r&sv=2026-04-06&sr=b&sig=LY3W3kpJCG%2BKKcMxmQzgpkEVkrZbqD57jyDK2F%2BFPow%3D",
                "branch_name": "Rajkot",
                "batch_name": null
            },
            "attendance_percentage": 100.0,
            "present_count": 2,
            "absent_count": 0,
            "late_count": 0,
            "last_attendance_date": "2026-05-28"
        }
    ]
}
```

---

### 3. Student Detailed Attendance Report
* **Endpoint:** `GET /api/v1/attendance/students/<uuid:student_id>/`
* **Response Sample:**
```json
{
  "success": true,
  "data": {
    "student_profile": {
      "id": "student-uuid",
      "name": "Jane Doe",
      "roll_number": "RL-101",
      "admission_number": "ADM-2026",
      "branch_name": "Main Campus",
      "batch_name": "Batch 2026-A"
    },
    "attendance_percentage": 85.50,
    "summary": {
      "present_count": 18,
      "absent_count": 3,
      "late_count": 2
    },
    "check_in_history": [
      { "date": "2026-06-11", "time": "2026-06-11T09:05:00Z", "status": "late" }
    ],
    "check_out_history": [
      { "date": "2026-06-11", "time": "2026-06-11T16:00:00Z" }
    ],
    "violations": [],
    "monthly_trend": [
      { "month": "2026-06", "percentage": 85.50 }
    ],
    "subject_wise_attendance": [
      { "subject_id": "subject-uuid", "subject_name": "Mathematics", "percentage": 90.00 }
    ],
    "session_wise_attendance": [
      { "session": "morning", "percentage": 85.50 }
    ]
  }
}
```

---

### 4. Daily Attendance History Log
* **Endpoint:** `GET /api/v1/attendance/history/`
* **Filters:**
  * `student_id`, `branch_id`, `batch_id`, `faculty_id`
  * `date_from`, `date_to` (format: `YYYY-MM-DD`)
  * `attendance_status` (present, late, absent)
  * `session`, `subject`
* **Response Sample:**
```json
{
    "success": true,
    "count": 3,
    "page_size": 50,
    "data": [
        {
            "date": "2026-05-29",
            "check_in_time": null,
            "check_out_time": null,
            "status": "present",
            "late_status": "normal",
            "session": "morning",
            "subject": "General / Other",
            "scanner_device": "N/A"
        },
        {
            "date": "2026-05-28",
            "check_in_time": null,
            "check_out_time": null,
            "status": "present",
            "late_status": "normal",
            "session": "morning",
            "subject": "General / Other",
            "scanner_device": "N/A"
        },
        {
            "date": "2026-04-28",
            "check_in_time": null,
            "check_out_time": null,
            "status": "present",
            "late_status": "normal",
            "session": "morning",
            "subject": "General / Other",
            "scanner_device": "N/A"
        }
    ]
}
```

---

### 5. Monthly Batch Attendance Register Sheet Matrix
* **Endpoint:** `GET /api/v1/attendance/batches/<uuid:batch_id>/register/`
* **Filters:**
  * `month` (format: `YYYY-MM`, defaults to current month)
* **Response Sample:**
```json
{
  "success": true,
  "data": {
    "month": "2026-06",
    "dates": ["2026-06-01", "2026-06-02"],
    "register": [
      {
        "student_id": "student-uuid",
        "student_name": "Jane Doe",
        "roll_number": "RL-101",
        "attendance": {
          "2026-06-01": {
            "status": "present",
            "checked_in_at": "2026-06-01T09:00:00Z",
            "checked_out_at": "2026-06-01T16:00:00Z"
          }
        }
      }
    ]
  }
}
```

---

### 6. Faculty Attendance Summary List
* **Endpoint:** `GET /api/v1/attendance/faculty/`
* **Filters:**
  * `faculty_id`, `branch_id`
  * `date_from`, `date_to` (format: `YYYY-MM-DD`)
* **Response Sample:**
```json
{
    "success": true,
    "count": 4,
    "page_size": 50,
    "data": [
        {
            "id": "80527112-7065-477c-81c9-9e2a54a917bb",
            "faculty_details": {
                "id": "80527112-7065-477c-81c9-9e2a54a917bb",
                "name": "Hemish Pansuriya",
                "employee_id": "EMP-71AA-0001",
                "email": "hemishnandlal@gmail.com",
                "branch_name": "Ahmedabad campus"
            },
            "present_count": 0,
            "absent_count": 23,
            "leave_count": 0,
            "attendance_percentage": 0.0
        },
        {
            "id": "6e03cc21-f6d7-42f1-a41c-b38b19c2a589",
            "faculty_details": {
                "id": "6e03cc21-f6d7-42f1-a41c-b38b19c2a589",
                "name": "Super Test",
                "employee_id": "EMP-DD4B-0003",
                "email": "test@gmail.com",
                "branch_name": "Vadodara Insight"
            },
            "present_count": 0,
            "absent_count": 23,
            "leave_count": 0,
            "attendance_percentage": 0.0
        }
    ]
}
```

---

### 7. Faculty Detailed Attendance Report
* **Endpoint:** `GET /api/v1/attendance/faculty/<uuid:faculty_id>/`
* **Response Sample:**
```json
{
    "success": true,
    "data": {
        "faculty": {
            "id": "80527112-7065-477c-81c9-9e2a54a917bb",
            "name": "Hemish Pansuriya",
            "employee_id": "EMP-71AA-0001",
            "email": "hemishnandlal@gmail.com"
        },
        "summary": {
            "present_count": 0,
            "absent_count": 23,
            "leave_count": 0,
            "attendance_percentage": 0.0
        },
        "daily_attendance_history": [],
        "check_in_logs": [],
        "check_out_logs": [],
        "working_hours": {
            "total_hours": 0,
            "average_hours_per_day": 0
        },
        "monthly_analytics": [
            {
                "month": "2026-01",
                "percentage": 0.0
            },
            {
                "month": "2026-02",
                "percentage": 0.0
            },
            {
                "month": "2026-03",
                "percentage": 0.0
            },
            {
                "month": "2026-04",
                "percentage": 0.0
            },
            {
                "month": "2026-05",
                "percentage": 0.0
            },
            {
                "month": "2026-06",
                "percentage": 0.0
            }
        ]
    }
}
```

---

### 8. Advanced Aggregated Performance Analytics & Trends
* **Endpoint:** `GET /api/v1/attendance/analytics/`
* **Filters:**
  * `branch`, `batch`, `course`, `faculty`, `student`
  * `date_from`, `date_to` (format: `YYYY-MM-DD`)
* **Response Sample:**
```json
{
    "success": true,
    "data": {
        "average_attendance": 100.0,
        "attendance_trends": {
            "daily_trend": [
                {
                    "date": "2026-04-28",
                    "percentage": 100.0
                },
                {
                    "date": "2026-05-28",
                    "percentage": 100.0
                },
                {
                    "date": "2026-05-29",
                    "percentage": 100.0
                }
            ],
            "weekly_trend": [
                {
                    "week_start_date": "2026-04-27",
                    "percentage": 100.0
                },
                {
                    "week_start_date": "2026-05-25",
                    "percentage": 100.0
                }
            ],
            "monthly_trend": [
                {
                    "month": "2026-04",
                    "percentage": 100.0
                },
                {
                    "month": "2026-05",
                    "percentage": 100.0
                }
            ]
        },
        "branch_comparison": [
            {
                "branch_name": "Gandhinagar",
                "percentage": 100.0
            }
        ],
        "batch_comparison": [
            {
                "batch_name": "Batch S",
                "batch_code": "BAT-2026-0004",
                "percentage": 100.0
            }
        ],
        "faculty_comparison": []
    }
}
```

---

### 9. Defaulter Students Report
* **Endpoint:** `GET /api/v1/attendance/defaulters/`
* **Filters:**
  * `attendance_threshold` (float, defaults to `75.0`)
  * `branch`, `batch`, `course`
* **Response Sample:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "student-uuid",
      "student_profile": {
        "id": "student-uuid",
        "name": "John Doe",
        "roll_number": "RL-102",
        "admission_number": "ADM-2027",
        "branch_name": "Main Campus",
        "batch_name": "Batch 2026-A"
      },
      "attendance_percentage": 62.40,
      "active_violations": 2
    }
  ]
}
```

---

### 10. Violations Listing
* **Endpoint:** `GET /api/v1/attendance/violations/`
* **Filters:**
  * `student` (UUID), `branch` (UUID), `batch` (UUID)
  * `violation_type` (e.g. `absent`, `late`, `unauthorized`)
  * `resolved` (`true`/`false`)
  * `date_from`, `date_to` (format: `YYYY-MM-DD`)
* **Response Sample:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "violation-uuid",
      "student": {
        "id": "student-uuid",
        "name": "John Doe",
        "roll_number": "RL-102"
      },
      "violation_type": "absent",
      "date": "2026-06-10",
      "description": "Repeated absent violations.",
      "is_resolved": false,
      "created_at": "2026-06-10T12:00:00Z"
    }
  ]
}
```

---





---

### 13. Export Attendance Report (CSV)
* **Endpoint:** `GET /api/v1/attendance/export/`
* **Filters:**
  * `branch`, `batch`, `student`, `faculty`
  * `date_from`, `date_to` (format: `YYYY-MM-DD`)
* **Response:** File Download (`attendance_report.csv`)

---

