package com.sveri.mentortrack_student;

import java.util.Map;

public class ExamData {
    private String examName;
    private Map<String, Object> marks;

    public ExamData(String examName, Map<String, Object> marks) {
        this.examName = examName;
        this.marks = marks;
    }

    public String getExamName() {
        return examName;
    }

    public Map<String, Object> getMarks() {
        return marks;
    }
}
