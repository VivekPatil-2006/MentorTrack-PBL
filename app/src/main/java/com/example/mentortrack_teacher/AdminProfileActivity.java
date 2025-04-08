package com.example.mentortrack_teacher;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.imageview.ShapeableImageView;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textview.MaterialTextView;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.FirebaseFirestore;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class AdminProfileActivity extends AppCompatActivity {

    private static final int PICK_IMAGE_REQUEST = 1;

    private TextInputEditText editName, editPhone, editAddress, editOldPassword, editNewPassword;
    private Spinner spinnerDepartment;
    private MaterialButton buttonUpdate;
    private MaterialTextView textEmail;
    private ShapeableImageView profileImageView;

    private FirebaseFirestore db;
    private String email, storedPassword, base64ProfileImage = null;
    private boolean isInEditMode = false;
    private final String[] departments = {"Computer", "ENTC", "IT", "AIDS", "ECE"};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin_profile);

        db = FirebaseFirestore.getInstance();

        // Initialize views
        profileImageView = findViewById(R.id.profileImageView);
        editName = findViewById(R.id.editName);
        editPhone = findViewById(R.id.editPhone);
        editAddress = findViewById(R.id.editAddress);
        editOldPassword = findViewById(R.id.editOldPassword);
        editNewPassword = findViewById(R.id.editNewPassword);
        spinnerDepartment = findViewById(R.id.spinnerDepartment);
        textEmail = findViewById(R.id.textEmail);
        buttonUpdate = findViewById(R.id.buttonUpdate);

        // Set department spinner adapter
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, departments);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerDepartment.setAdapter(adapter);

        // Load saved email
        SharedPreferences preferences = getSharedPreferences("MentorPrefs", MODE_PRIVATE);
        email = preferences.getString("email", null);

        if (email != null) {
            textEmail.setText(email);
            loadMentorData(email);
        } else {
            Toast.makeText(this, "Email not found in preferences", Toast.LENGTH_SHORT).show();
        }

        // Profile image click
        profileImageView.setOnClickListener(v -> {
            if (isInEditMode) {
                openImageChooser();
            }
        });

        // Update / Save Button
        buttonUpdate.setOnClickListener(v -> {
            if (!isInEditMode) {
                setFieldsEditable(true);
                buttonUpdate.setText("Save");
                isInEditMode = true;
            } else {
                if (validateInputs()) {
                    updateMentorData();
                    setFieldsEditable(false);
                    buttonUpdate.setText("Update");
                    isInEditMode = false;
                }
            }
        });

        // Initially disable editing
        setFieldsEditable(false);
    }

    private void setFieldsEditable(boolean editable) {
        editName.setEnabled(editable);
        editPhone.setEnabled(editable);
        editAddress.setEnabled(editable);
        editOldPassword.setEnabled(editable);
        editNewPassword.setEnabled(editable);
        spinnerDepartment.setEnabled(editable);
    }

    private void openImageChooser() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        if (intent.resolveActivity(getPackageManager()) != null) {
            startActivityForResult(intent, PICK_IMAGE_REQUEST);
        } else {
            Toast.makeText(this, "No app found to pick image", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == PICK_IMAGE_REQUEST && resultCode == Activity.RESULT_OK && data != null) {
            Uri imageUri = data.getData();
            try {
                if (imageUri != null) {
                    InputStream inputStream = getContentResolver().openInputStream(imageUri);
                    Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
                    profileImageView.setImageBitmap(bitmap);
                    base64ProfileImage = encodeImageToBase64(bitmap);
                }
            } catch (Exception e) {
                e.printStackTrace();
                Toast.makeText(this, "Failed to load image", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private String encodeImageToBase64(Bitmap bitmap) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, baos);
        byte[] imageBytes = baos.toByteArray();
        return Base64.encodeToString(imageBytes, Base64.DEFAULT);
    }

    private void loadMentorData(String email) {
        DocumentReference docRef = db.collection("teachers").document(email);
        docRef.get().addOnSuccessListener(documentSnapshot -> {
            if (documentSnapshot.exists()) {
                editName.setText(documentSnapshot.getString("name"));
                editPhone.setText(documentSnapshot.getString("phone"));
                editAddress.setText(documentSnapshot.getString("address"));
                storedPassword = documentSnapshot.getString("password");

                String dept = documentSnapshot.getString("department");
                if (dept != null) {
                    int index = Arrays.asList(departments).indexOf(dept);
                    if (index >= 0) spinnerDepartment.setSelection(index);
                }

                String profileImageBase64 = documentSnapshot.getString("profileImage");
                if (profileImageBase64 != null) {
                    byte[] decodedBytes = Base64.decode(profileImageBase64, Base64.DEFAULT);
                    Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
                    profileImageView.setImageBitmap(bitmap);
                    base64ProfileImage = profileImageBase64;
                }
            } else {
                Toast.makeText(this, "No profile data found", Toast.LENGTH_SHORT).show();
            }
        }).addOnFailureListener(e -> {
            e.printStackTrace();
            Toast.makeText(this, "Failed to load data", Toast.LENGTH_SHORT).show();
        });
    }

    private boolean validateInputs() {
        if (Objects.requireNonNull(editName.getText()).toString().trim().isEmpty()
                || Objects.requireNonNull(editPhone.getText()).toString().trim().isEmpty()
                || Objects.requireNonNull(editAddress.getText()).toString().trim().isEmpty()) {
            Toast.makeText(this, "Please fill all details", Toast.LENGTH_SHORT).show();
            return false;
        }

        String oldPass = editOldPassword.getText().toString().trim();
        String newPass = editNewPassword.getText().toString().trim();

        if (!oldPass.isEmpty() || !newPass.isEmpty()) {
            if (oldPass.isEmpty() || newPass.isEmpty()) {
                Toast.makeText(this, "Fill both password fields", Toast.LENGTH_SHORT).show();
                return false;
            }

            if (!oldPass.equals(storedPassword)) {
                Toast.makeText(this, "Old password incorrect", Toast.LENGTH_SHORT).show();
                return false;
            }

            storedPassword = newPass; // update local copy
        }

        return true;
    }

    private void updateMentorData() {
        Map<String, Object> updatedData = new HashMap<>();
        updatedData.put("name", editName.getText().toString().trim());
        updatedData.put("phone", editPhone.getText().toString().trim());
        updatedData.put("address", editAddress.getText().toString().trim());
        updatedData.put("department", spinnerDepartment.getSelectedItem().toString());
        updatedData.put("password", storedPassword);
        if (base64ProfileImage != null) {
            updatedData.put("profileImage", base64ProfileImage);
        }

        db.collection("teachers").document(email)
                .update(updatedData)
                .addOnSuccessListener(unused -> Toast.makeText(this, "Profile updated successfully", Toast.LENGTH_SHORT).show())
                .addOnFailureListener(e -> {
                    e.printStackTrace();
                    Toast.makeText(this, "Failed to update profile", Toast.LENGTH_SHORT).show();
                });
    }
}
