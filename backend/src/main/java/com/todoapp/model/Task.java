package com.todoapp.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "tasks")
public class Task {
    @Id
    private String id;
    private String title;
    private boolean completed;
    private String userId;

    public Task() {}

    public Task(String title, boolean completed, String userId) {
        this.title = title;
        this.completed = completed;
        this.userId = userId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
