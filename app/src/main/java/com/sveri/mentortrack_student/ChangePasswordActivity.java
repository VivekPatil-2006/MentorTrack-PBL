package com.sveri.mentortrack_student;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.Toast;
import android.widget.Toolbar;

import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.FirebaseFirestore;

public class ChangePasswordActivity extends AppCompatActivity {

    private TextInputEditText currentPasswordEditText, newPasswordEditText, confirmPasswordEditText;
    private Button changePasswordButton;
    private FirebaseFirestore db;
    private String email, storedPassword;
    private ImageButton backbtn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_change_password);

        // Initialize views
        currentPasswordEditText = findViewById(R.id.currentPasswordEditText);
        newPasswordEditText = findViewById(R.id.newPasswordEditText);
        confirmPasswordEditText = findViewById(R.id.confirmPasswordEditText);
        changePasswordButton = findViewById(R.id.changePasswordButton);
        backbtn = findViewById(R.id.backButton);
        db = FirebaseFirestore.getInstance();

        // Get email from SharedPreferences (do not modify LoginActivity)
        SharedPreferences prefs = getSharedPreferences("MyPrefs", MODE_PRIVATE);
        email = prefs.getString("email", null);

        if (email == null) {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Load stored password from Firestore
        db.collection("students").document(email)
                .get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        storedPassword = documentSnapshot.getString("password");
                    } else {
                        Toast.makeText(this, "User data not found", Toast.LENGTH_SHORT).show();
                        finish();
                    }
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "Error loading user data", Toast.LENGTH_SHORT).show();
                    finish();
                });

        changePasswordButton.setOnClickListener(v -> {
            String current = currentPasswordEditText.getText().toString().trim();
            String newPass = newPasswordEditText.getText().toString().trim();
            String confirm = confirmPasswordEditText.getText().toString().trim();

            if (current.isEmpty() || newPass.isEmpty() || confirm.isEmpty()) {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
                return;
            }

            if (!current.equals(storedPassword)) {
                Toast.makeText(this, "Current password is incorrect", Toast.LENGTH_SHORT).show();
                return;
            }

            if (!newPass.equals(confirm)) {
                Toast.makeText(this, "New passwords do not match", Toast.LENGTH_SHORT).show();
                return;
            }

            if (newPass.length() < 6) {
                Toast.makeText(this, "Password should be at least 6 characters", Toast.LENGTH_SHORT).show();
                return;
            }

            // Update password field only
            DocumentReference studentRef = db.collection("students").document(email);
            studentRef.update("password", newPass)
                    .addOnSuccessListener(unused -> {
                        Toast.makeText(this, "Password changed successfully", Toast.LENGTH_SHORT).show();

                        // Update SharedPreferences password
                        SharedPreferences.Editor editor = prefs.edit();
                        editor.putString("password", newPass);
                        editor.apply();

                        finish();
                    })
                    .addOnFailureListener(e -> {
                        Toast.makeText(this, "Failed to update password", Toast.LENGTH_SHORT).show();
                    });
        });
        backbtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent=new Intent(getApplicationContext(), HomeActivity.class);
                startActivity(intent);
            }
        });
    }
}
