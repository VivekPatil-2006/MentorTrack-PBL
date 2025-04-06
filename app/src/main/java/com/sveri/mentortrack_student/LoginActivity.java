package com.sveri.mentortrack_student;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.google.firebase.firestore.FirebaseFirestore;

public class LoginActivity extends AppCompatActivity {

    EditText emailEditText, passwordEditText;
    Button loginButton;
    FirebaseFirestore db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        emailEditText = findViewById(R.id.emailEditText);
        passwordEditText = findViewById(R.id.passwordEditText);
        loginButton = findViewById(R.id.loginButton);
        db = FirebaseFirestore.getInstance();

        loginButton.setOnClickListener(view -> {
            String email = emailEditText.getText().toString().trim();
            String password = passwordEditText.getText().toString().trim();

            if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                emailEditText.setError("Invalid email");
                return;
            }

            if (password.isEmpty()) {
                passwordEditText.setError("Password required");
                return;
            }

            db.collection("students").document(email)
                    .get()
                    .addOnSuccessListener(documentSnapshot -> {
                        if (documentSnapshot.exists()) {
                            String storedPassword = documentSnapshot.getString("password");
                            if (storedPassword != null && storedPassword.equals(password)) {
                                // Save email & password to SharedPreferences
                                SharedPreferences prefs = getSharedPreferences("MyPrefs", MODE_PRIVATE);
                                SharedPreferences.Editor editor = prefs.edit();
                                editor.putString("email", email);
                                editor.putString("password", password);
                                editor.apply();

                                Toast.makeText(this, "Login successful", Toast.LENGTH_SHORT).show();
                                startActivity(new Intent(this, HomeActivity.class));
                                finish();
                            } else {
                                Toast.makeText(this, "Incorrect password", Toast.LENGTH_SHORT).show();
                            }
                        } else {
                            Toast.makeText(this, "User not found", Toast.LENGTH_SHORT).show();
                        }
                    })
                    .addOnFailureListener(e ->
                            Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show()
                    );
        });
    }
}
