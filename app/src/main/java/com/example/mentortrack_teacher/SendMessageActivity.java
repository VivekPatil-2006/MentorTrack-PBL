package com.example.mentortrack_teacher;

import android.os.Bundle;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.firestore.FirebaseFirestore;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class SendMessageActivity extends AppCompatActivity {

    private EditText editSubject, editMessage;
    private Button btnSend;
    private FirebaseFirestore db;
    private String studentEmail;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_send_message);

        editSubject = findViewById(R.id.edit_subject);
        editMessage = findViewById(R.id.edit_message);
        btnSend = findViewById(R.id.btn_send_message);

        db = FirebaseFirestore.getInstance();

        studentEmail = getIntent().getStringExtra("email");

        btnSend.setOnClickListener(v -> sendFeedback());
    }

    private void sendFeedback() {
        String subject = editSubject.getText().toString().trim();
        String message = editMessage.getText().toString().trim();

        if (TextUtils.isEmpty(subject)) {
            editSubject.setError("Subject required");
            return;
        }

        if (TextUtils.isEmpty(message)) {
            editMessage.setError("Message required");
            return;
        }

        if (studentEmail == null || studentEmail.isEmpty()) {
            Toast.makeText(this, "Student email missing", Toast.LENGTH_SHORT).show();
            return;
        }

        // Format time to "HH:mm"
        String formattedTime = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());

        Map<String, Object> feedbackMap = new HashMap<>();
        feedbackMap.put(subject, message);

        db.collection("students")
                .document(studentEmail)
                .collection("feedback")
                .document(formattedTime)
                .set(feedbackMap)
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(this, "Feedback sent at " + formattedTime, Toast.LENGTH_SHORT).show();
                    finish();
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "Failed to send feedback", Toast.LENGTH_SHORT).show();
                });
    }
}
