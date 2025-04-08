package com.sveri.mentortrack_student;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.ImageButton;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class FeedbackActivity extends AppCompatActivity {

    private RecyclerView feedbackRecyclerView;
    private FeedbackAdapter feedbackAdapter;
    private List<FeedbackItem> feedbackList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_feedback);

        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        ImageButton backButton = findViewById(R.id.backButton);
        feedbackRecyclerView = findViewById(R.id.feedbackRecyclerView);

        feedbackList = new ArrayList<>();
        feedbackAdapter = new FeedbackAdapter(feedbackList);
        feedbackRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        feedbackRecyclerView.setAdapter(feedbackAdapter);

        backButton.setOnClickListener(v -> onBackPressed());

        // Get email from SharedPreferences
        SharedPreferences prefs = getSharedPreferences("MyPrefs", MODE_PRIVATE);
        String email = prefs.getString("email", "");

        if (email != null && !email.isEmpty()) {
            fetchFeedbacks(email);
        }
    }

    private void fetchFeedbacks(String email) {
        FirebaseFirestore db = FirebaseFirestore.getInstance();
        CollectionReference feedbackRef = db.collection("students")
                .document(email)
                .collection("feedback");

        feedbackRef.get().addOnSuccessListener(querySnapshot -> {
            feedbackList.clear();
            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                Map<String, Object> feedbackMap = doc.getData();
                if (feedbackMap != null) {
                    for (Map.Entry<String, Object> entry : feedbackMap.entrySet()) {
                        feedbackList.add(new FeedbackItem(entry.getKey(), entry.getValue().toString()));
                    }
                }
            }
            feedbackAdapter.notifyDataSetChanged();
        }).addOnFailureListener(e -> Log.e("FeedbackActivity", "Error fetching feedback", e));
    }
}
