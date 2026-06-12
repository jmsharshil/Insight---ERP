# Exam Management System API Reference

This document provides a step-by-step API reference for the Exam module's endpoints, describing the HTTP methods, paths, exact request payloads (JSON), and response formats.

---

## 1. Setup & Configuration Phase

### 1.1 Create Exam
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/`
*   **Roles**: `super_admin`, `branch_manager`, `admin_senior_executive`, `faculty`
*   **Request Body (JSON)**:
    ```json
    {
      "title": "Midterm Physics Exam",
      "exam_type": "online", // "online" or "offline"
      "batch": "a3b4c5d6-e7f8-9012-3456-7890abcdef12", // Batch ID (UUID)
      "subject": "b4c5d6e7-f890-1234-5678-90abcdef1234", // Subject ID (UUID, optional)
      "total_marks": 100,
      "pass_marks": 40,
      "duration_minutes": 120,
      "scheduled_date": "2026-06-15",
      "start_time": "10:00:00",
      "end_time": "12:00:00",
      "instructions": "Calculators are not allowed.",
      "geo_lat": 12.971598, // Optional: Lat for geofencing
      "geo_lon": 77.594562, // Optional: Lon for geofencing
      "geo_radius_meters": 100, // Optional: Radius boundary. Set 0 to disable.
      "geo_check_interval_minutes": 10, // Periodic check interval (0 = start only)
      "screen_lock_max_violations": 3, // Allowable tab switch warnings
      "screen_lock_action": "auto_submit", // "auto_submit" or "flag_only"
      "split_screen_max_warnings": 2, // Allowable split screen warnings
      "split_screen_action": "auto_submit", // "auto_submit" or "flag_only"
      "result_release_mode": "instant" // "instant" (MCQs only) or "manual"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Exam created.",
      "data": {
        "id": "e5f6g7h8-i9j0-1234-5678-90abcdef1234",
        "title": "Midterm Physics Exam",
        "exam_type": "online",
        "total_marks": 100,
        "pass_marks": 40,
        "duration_minutes": 120,
        "scheduled_date": "2026-06-15",
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "status": "draft",
        "status_display": "Draft",
        "batch": "a3b4c5d6-e7f8-9012-3456-7890abcdef12",
        "batch_name": "Physics Batch A",
        "subject": "b4c5d6e7-f890-1234-5678-90abcdef1234",
        "subject_name": "Advanced Physics",
        "branch": "c3d4e5f6-g7h8-9012-3456-7890abcdef12",
        "created_by": "d4e5f6g7-h8i9-0123-4567-890abcdef123",
        "created_by_name": "Dr. Smith",
        "created_at": "2026-06-12T10:00:00.123456Z",
        "geo_radius_meters": 100,
        "geo_check_interval_minutes": 10,
        "screen_lock_max_violations": 3,
        "screen_lock_action": "auto_submit",
        "split_screen_max_warnings": 2,
        "split_screen_action": "auto_submit",
        "result_release_mode": "instant"
      }
    }
    ```

### 1.2 Add Questions & Choices
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/questions/`
*   **Roles**: `super_admin`, `admin_senior_executive`, `faculty` (if creator)
*   **Request Body (JSON)**:
    ```json
    [
      {
        "question_text": "What is the unit of Force?",
        "question_type": "mcq", // "mcq", "subjective", or "true_false"
        "marks": 5,
        "order": 1,
        "choices": [
          {
            "text": "Newton",
            "is_correct": true
          },
          {
            "text": "Joule",
            "is_correct": false
          },
          {
            "text": "Watt",
            "is_correct": false
          }
        ]
      },
      {
        "question_text": "Explain Newton's First Law of Motion.",
        "question_type": "subjective",
        "marks": 15,
        "order": 2
      }
    ]
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Questions added",
      "details": {}
    }
    ```

### 1.3 Assign Seating (Offline Only)
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/seating/`
*   **Roles**: `super_admin`, `exam_supervisor`, `admin_senior_executive`
*   **Request Body (JSON - Auto Seating Option)**:
    ```json
    {
      "auto": true
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Auto-assigned 25 seats."
    }
    ```
*   **Request Body (JSON - Manual Seating Option)**:
    ```json
    [
      {
        "student_id": "7890abcd-1234-5678-9012-34567890abcd",
        "room_name": "Main Hall A",
        "seat_number": "Row 2 - Seat 14",
        "row_number": 2
      }
    ]
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Assigned 1 seats."
    }
    ```

---

## 2. Active Exam Phase (Student & Proctoring)

### 2.1 Start Exam
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/start/`
*   **Roles**: `student`
*   **Headers**: Requires `X-Device-Fingerprint` (unique device string value).
*   **Request Body (JSON)**:
    ```json
    {
      "student_lat": 12.971598, // Required if geo_radius_meters > 0
      "student_lon": 77.594562
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "session_id": "9012abcd-ef01-2345-6789-0123456789ab",
      "remaining_seconds": 7200,
      "autosave_interval_seconds": 30,
      "geo_check_interval_minutes": 10,
      "exam_title": "Midterm Physics Exam",
      "total_marks": 100,
      "questions": [
        {
          "id": "12345678-abcd-ef01-2345-678901234567",
          "question_text": "What is the unit of Force?",
          "question_type": "mcq",
          "marks": 5,
          "order": 1,
          "choices": [
            {
              "id": "c1d2e3f4-5678-9012-3456-7890abcdef12",
              "choice_text": "Newton"
            },
            {
              "id": "d2e3f4g5-6789-0123-4567-890abcdef123",
              "choice_text": "Joule"
            },
            {
              "id": "e3f4g5h6-7890-1234-5678-90abcdef1234",
              "choice_text": "Watt"
            }
          ],
          "question_type_display": "MCQ"
        }
      ]
    }
    ```

### 2.2 Autosave Answer
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/sessions/{session_id}/autosave/`
*   **Roles**: `student`
*   **Request Body (JSON)**:
    ```json
    {
      "question_id": "12345678-abcd-ef01-2345-678901234567",
      "selected_choice_id": "c1d2e3f4-5678-9012-3456-7890abcdef12", // Optional (for MCQ)
      "text_answer": "" // Optional (for Subjective)
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "saved": true,
      "question_id": "12345678-abcd-ef01-2345-678901234567",
      "remaining_seconds": 7170
    }
    ```

### 2.3 Log Screen Event (Tab switches / split-screens)
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/sessions/{session_id}/screen-event/`
*   **Roles**: `student` (Logged dynamically by frontend SDK)
*   **Request Body (JSON)**:
    ```json
    {
      "event": "lock_breach" // "lock_breach" or "split_screen"
    }
    ```
*   **Response (200 OK - Warning issued)**:
    ```json
    {
      "event_logged": true,
      "warning": true,
      "violations": 1,
      "remaining_before_action": 2,
      "action": "warning_issued"
    }
    ```
*   **Response (200 OK - Forced submission due to violations)**:
    ```json
    {
      "event_logged": true,
      "auto_submitted": true,
      "reason": "Screen lock violation limit reached",
      "action": "auto_submitted"
    }
    ```

### 2.4 Periodic Geo-boundary Verification
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/sessions/{session_id}/geo-check/`
*   **Roles**: `student`
*   **Request Body (JSON)**:
    ```json
    {
      "student_lat": 12.971598,
      "student_lon": 77.594562
    }
    ```
*   **Response (200 OK - Inside Zone)**:
    ```json
    {
      "geo_check": "passed",
      "distance_m": 1.2
    }
    ```
*   **Response (403 Forbidden - Outside Zone)**:
    ```json
    {
      "error": "Location check failed. You are outside the exam zone.",
      "distance_m": 140.5,
      "allowed_m": 100,
      "action": "flagged"
    }
    ```

### 2.5 Log Malpractice (Supervisor Proctoring)
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/malpractice/`
*   **Roles**: `super_admin`, `exam_supervisor`
*   **Request Body (JSON)**:
    ```json
    {
      "student_id": "7890abcd-1234-5678-9012-34567890abcd",
      "description": "Student was seen browsing reference textbooks.",
      "severity": "disqualified" // "minor", "major", or "disqualified"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "report_id": "f5f6g7h8-i9j0-1234-5678-90abcdef1234"
    }
    ```
    *(Note: Severity `disqualified` immediately submits/locks the active session).*

---

## 3. Submission & Grading Phase

### 3.1 Submit Exam
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/submit/`
*   **Roles**: `student`
*   **Request Body (JSON)**:
    ```json
    {
      "session_id": "9012abcd-ef01-2345-6789-0123456789ab",
      "answers": [
        {
          "question_id": "12345678-abcd-ef01-2345-678901234567",
          "selected_choice_id": "c1d2e3f4-5678-9012-3456-7890abcdef12",
          "text_answer": ""
        }
      ]
    }
    ```
*   **Response (200 OK - Instant release MCQ)**:
    ```json
    {
      "submitted": true,
      "marks_obtained": 5,
      "percentage": 100.0,
      "is_pass": true
    }
    ```
*   **Response (200 OK - Subjective or Manual release mode)**:
    ```json
    {
      "submitted": true,
      "message": "Answers submitted. Results pending review."
    }
    ```

### 3.2 Distribute Answer Keys to Paper Checkers
*   **Method**: `POST`
*   **Endpoint**: `/api/v1/exams/{exam_id}/answer-key/distribute/`
*   **Roles**: `super_admin`, `admin_senior_executive`, `branch_manager`
*   **Request Body**: None (payload processed based on url parameter `exam_id`)
*   **Response (200 OK)**:
    ```json
    {
      "sent_to": ["Mr. John Doe", "Mrs. Alice Jane"],
      "count": 2
    }
    ```

### 3.3 Access Distributed Answer Key (Secure Tokenized)
*   **Method**: `GET`
*   **Endpoint**: `/api/v1/answer-key/{exam_id}/?token={log_id}_{signature}`
*   **Roles**: Exempt (Anyone with valid signature token link)
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "12345678-abcd-ef01-2345-678901234567",
        "question_text": "What is the unit of Force?",
        "question_type": "mcq",
        "marks": 5,
        "order": 1,
        "image": null,
        "choices": [
          {
            "id": "c1d2e3f4-5678-9012-3456-7890abcdef12",
            "choice_text": "Newton",
            "is_correct": true
          },
          {
            "id": "d2e3f4g5-6789-0123-4567-890abcdef123",
            "choice_text": "Joule",
            "is_correct": false
          }
        ],
        "question_type_display": "MCQ"
      }
    ]
    ```
