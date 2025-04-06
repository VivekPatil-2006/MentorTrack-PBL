package com.sveri.mentortrack_student;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.SetOptions;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ProfileActivity extends AppCompatActivity {

    private static final int PICK_IMAGE_REQUEST = 1;

    private TextInputEditText editName, editEmail, editPhoneNumber,
            editDivision, editBatch, editRollNo, editAddress, editParentPhone;
    private Spinner spinnerDepartment;
    private Spinner spinnerYear;
    private ImageView profileImageView;
    private FirebaseFirestore db;
    private SharedPreferences prefs;
    private String email;
    private Button editButton;
    private Bitmap selectedBitmap = null;
    private ImageButton backbtn;
    List<String> departments = Arrays.asList("Department","Computer", "IT", "ENTC", "AIDS", "ECE");
    List<String> years = Arrays.asList("Year", "First Year", "Second Year", "Third Year", "Final Year");


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        // Enable back button in toolbar
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Profile");
        }

        db = FirebaseFirestore.getInstance();
        prefs = getSharedPreferences("MyPrefs", Context.MODE_PRIVATE);
        email = prefs.getString("email", null);

        if (email == null) {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Initialize views
        editName = findViewById(R.id.editProfileName);
        editEmail = findViewById(R.id.editProfileEmail);
        editPhoneNumber = findViewById(R.id.etPhoneNumber);
        editDivision = findViewById(R.id.etDivision);
        editBatch = findViewById(R.id.etBatch);
        editRollNo = findViewById(R.id.etRollNo);
        editAddress = findViewById(R.id.etAddress);
        editParentPhone = findViewById(R.id.etParentPhone);
        profileImageView = findViewById(R.id.profileImage);
        editButton = findViewById(R.id.editButton);
        backbtn = findViewById(R.id.backButton);
        spinnerDepartment = findViewById(R.id.spinnerDepartment);

        spinnerYear = findViewById(R.id.spinnerYear);

        ArrayAdapter<String> yearAdapter = new ArrayAdapter<>(
                this,
                android.R.layout.simple_spinner_item,
                years
        );
        yearAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerYear.setAdapter(yearAdapter);


        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this,
                android.R.layout.simple_spinner_item,
                departments
        );
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerDepartment.setAdapter(adapter);

        editEmail.setText(email);
        editEmail.setEnabled(false);

        loadProfileData();

        editButton.setOnClickListener(v -> saveProfileData());

        backbtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent=new Intent(getApplicationContext(), HomeActivity.class);
                startActivity(intent);
            }
        });
        profileImageView.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_PICK);
            intent.setType("image/*");
            startActivityForResult(intent, PICK_IMAGE_REQUEST);
        });
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == PICK_IMAGE_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            Uri imageUri = data.getData();
            try {
                selectedBitmap = MediaStore.Images.Media.getBitmap(this.getContentResolver(), imageUri);
                profileImageView.setImageBitmap(selectedBitmap);
            } catch (IOException e) {
                e.printStackTrace();
                Toast.makeText(this, "Failed to load image", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void loadProfileData() {
        DocumentReference docRef = db.collection("students").document(email);
        docRef.get().addOnSuccessListener(documentSnapshot -> {
            if (documentSnapshot.exists()) {
                editName.setText(documentSnapshot.getString("name"));
                editPhoneNumber.setText(documentSnapshot.getString("phonenumber"));
                String savedDept = documentSnapshot.getString("department");
                if (savedDept != null) {
                    int index = departments.indexOf(savedDept);
                    if (index >= 0) {
                        spinnerDepartment.setSelection(index);
                    }
                }

                String savedYear = documentSnapshot.getString("year");
                if (savedYear != null) {
                    int yearIndex = years.indexOf(savedYear);
                    if (yearIndex >= 0) {
                        spinnerYear.setSelection(yearIndex);
                    }
                }

                editDivision.setText(documentSnapshot.getString("division"));
                editBatch.setText(documentSnapshot.getString("batch"));
                editRollNo.setText(documentSnapshot.getString("rollno"));
                editAddress.setText(documentSnapshot.getString("address"));
                editParentPhone.setText(documentSnapshot.getString("parentphone"));

                String base64Photo = documentSnapshot.getString("profileImage");
                if (base64Photo != null && !base64Photo.isEmpty()) {
                    byte[] imageBytes = Base64.decode(base64Photo, Base64.DEFAULT);
                    Bitmap bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
                    profileImageView.setImageBitmap(bitmap);
                }
            }
        }).addOnFailureListener(e ->
                Toast.makeText(this, "Failed to load profile", Toast.LENGTH_SHORT).show());
    }

    private void saveProfileData() {
        String name = editName.getText().toString();
        String phone = editPhoneNumber.getText().toString();
        String dept = spinnerDepartment.getSelectedItem().toString();
        String year = spinnerYear.getSelectedItem().toString();
        String division = editDivision.getText().toString();
        String batch = editBatch.getText().toString();
        String roll = editRollNo.getText().toString();
        String address = editAddress.getText().toString();
        String parentPhone = editParentPhone.getText().toString();

        Bitmap bitmap = selectedBitmap;
        if (bitmap == null) {
            profileImageView.setDrawingCacheEnabled(true);
            profileImageView.buildDrawingCache();
            bitmap = profileImageView.getDrawingCache();
        }

        String base64Image = "";
        if (bitmap != null) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
            base64Image = Base64.encodeToString(baos.toByteArray(), Base64.DEFAULT);
        }

        DocumentReference docRef = db.collection("students").document(email);
        String finalBase64Image = base64Image;
        docRef.get().addOnSuccessListener(documentSnapshot -> {
            if (documentSnapshot.exists()) {
                String existingPassword = documentSnapshot.getString("password");

                Map<String, Object> data = new HashMap<>();
                data.put("name", name);
                data.put("email", email);
                data.put("phonenumber", phone);
                data.put("department", dept);
                data.put("year", year);
                data.put("division", division);
                data.put("batch", batch);
                data.put("rollno", roll);
                data.put("address", address);
                data.put("parentphone", parentPhone);
                data.put("profileImage", finalBase64Image);

                if (existingPassword != null) {
                    data.put("password", existingPassword);
                }

                docRef.set(data, SetOptions.merge())
                        .addOnSuccessListener(unused ->
                                Toast.makeText(ProfileActivity.this, "Profile updated", Toast.LENGTH_SHORT).show())
                        .addOnFailureListener(e ->
                                Toast.makeText(ProfileActivity.this, "Error updating profile", Toast.LENGTH_SHORT).show());
            } else {
                Toast.makeText(this, "User document does not exist", Toast.LENGTH_SHORT).show();
            }
        }).addOnFailureListener(e ->
                Toast.makeText(this, "Failed to fetch existing data", Toast.LENGTH_SHORT).show());
    }
}
