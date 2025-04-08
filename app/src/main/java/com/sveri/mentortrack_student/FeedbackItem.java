package com.sveri.mentortrack_student;

public class FeedbackItem {
    private String topic;
    private String description;

    public FeedbackItem(String topic, String description) {
        this.topic = topic;
        this.description = description;
    }

    public String getTopic() {
        return topic;
    }

    public String getDescription() {
        return description;
    }
}
