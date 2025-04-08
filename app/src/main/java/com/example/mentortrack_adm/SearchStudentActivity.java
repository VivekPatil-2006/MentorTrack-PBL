package com.example.mentortrack_adm;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.imageview.ShapeableImageView;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

public class SearchStudentActivity extends AppCompatActivity {

    private TextInputLayout emailInputLayout;
    private TextInputEditText etEmail;
    private MaterialButton btnSearch;
    private ShapeableImageView ivProfile;
    private TextInputEditText etStudentInfo;
    private MaterialCardView profileCard, infoCard;
    private FirebaseFirestore db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search_student);

        // Initialize views
        emailInputLayout = findViewById(R.id.emailInputLayout);
        etEmail = findViewById(R.id.etEmail);
        btnSearch = findViewById(R.id.btnSearch);
        ivProfile = findViewById(R.id.ivProfile);
        etStudentInfo = findViewById(R.id.etStudentInfo);
        profileCard = findViewById(R.id.profileCard);
        infoCard = findViewById(R.id.infoCard);

        db = FirebaseFirestore.getInstance();

        btnSearch.setOnClickListener(v -> searchStudent());
    }

    private void searchStudent() {
        String email = etEmail.getText().toString().trim();
        if (email.isEmpty()) {
            emailInputLayout.setError("Please enter student email");
            return;
        }
        emailInputLayout.setError(null); // Clear error if any

        db.collection("students").document(email).get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        DocumentSnapshot document = task.getResult();
                        if (document.exists()) {
                            showStudentInfo(document);
                        } else {
                            hideInfoViews();
                            Toast.makeText(this, "Student not found", Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        Toast.makeText(this, "Error: " + task.getException(), Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void showStudentInfo(DocumentSnapshot document) {
        // Get student data
        String name = document.getString("name");
        String email = document.getString("email");
        String phone = document.getString("phonenumber");
        String dept = document.getString("department");
        String year = document.getString("year");
        String division = document.getString("division");
        String batch = document.getString("batch");
        String rollno = document.getString("rollno");
        String address = document.getString("address");
        String parentPhone = document.getString("parentphone");
        String profileImage = document.getString("profileImage");

        // Build info string
        StringBuilder info = new StringBuilder();
        info.append("Name: ").append(getValueOrNA(name)).append("\n\n");
        info.append("Email: ").append(getValueOrNA(email)).append("\n\n");
        info.append("Phone: ").append(getValueOrNA(phone)).append("\n\n");
        info.append("Department: ").append(getValueOrNA(dept)).append("\n\n");
        info.append("Year: ").append(getValueOrNA(year)).append("\n\n");
        info.append("Division: ").append(getValueOrNA(division)).append("\n\n");
        info.append("Batch: ").append(getValueOrNA(batch)).append("\n\n");
        info.append("Roll No: ").append(getValueOrNA(rollno)).append("\n\n");
        info.append("Address: ").append(getValueOrNA(address)).append("\n\n");
        info.append("Parent Phone: ").append(getValueOrNA(parentPhone));

        etStudentInfo.setText(info.toString());
        infoCard.setVisibility(View.VISIBLE);

        // Handle profile image
        if (profileImage != null && !profileImage.isEmpty()) {
            try {
                String imageData = profileImage.contains(",") ?
                        profileImage.split(",")[1] : profileImage;
                byte[] decodedBytes = Base64.decode(imageData, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
                ivProfile.setImageBitmap(bitmap);
                profileCard.setVisibility(View.VISIBLE);
            } catch (IllegalArgumentException e) {
                profileCard.setVisibility(View.GONE);
                e.printStackTrace();
            }
        } else {
            profileCard.setVisibility(View.GONE);
        }
    }

    private String getValueOrNA(String value) {
        return (value != null && !value.isEmpty()) ? value : "N/A";
    }

    private void hideInfoViews() {
        infoCard.setVisibility(View.GONE);
        profileCard.setVisibility(View.GONE);
    }
}