package com.example.mentortrack_adm;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.util.Base64;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.imageview.ShapeableImageView;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.List;

public class SearchTeacherActivity extends AppCompatActivity {

    private TextInputLayout emailInputLayout;
    private TextInputEditText etEmail;
    private MaterialButton btnSearch;
    private ShapeableImageView ivProfile;
    private TextInputEditText etTeacherInfo;
    private MaterialCardView profileCard, infoCard, assignedStudentsCard;
    private RecyclerView rvAssignedStudents;
    private FirebaseFirestore db;
    private AssignedStudentsAdapter adapter;
    private List<String> assignedStudentsList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search_teacher);

        // Initialize views
        emailInputLayout = findViewById(R.id.emailInputLayout);
        etEmail = findViewById(R.id.etEmail);
        btnSearch = findViewById(R.id.btnSearch);
        ivProfile = findViewById(R.id.ivProfile);
        etTeacherInfo = findViewById(R.id.etTeacherInfo);
        profileCard = findViewById(R.id.profileCard);
        infoCard = findViewById(R.id.infoCard);
        assignedStudentsCard = findViewById(R.id.assignedStudentsCard);
        rvAssignedStudents = findViewById(R.id.rvAssignedStudents);

        db = FirebaseFirestore.getInstance();

        // Setup RecyclerView
        rvAssignedStudents.setLayoutManager(new LinearLayoutManager(this));
        adapter = new AssignedStudentsAdapter(assignedStudentsList);
        rvAssignedStudents.setAdapter(adapter);

        btnSearch.setOnClickListener(v -> searchTeacher());
    }

    private void searchTeacher() {
        String email = etEmail.getText().toString().trim();
        if (email.isEmpty()) {
            emailInputLayout.setError("Please enter teacher email");
            return;
        }
        emailInputLayout.setError(null);

        db.collection("teachers").document(email).get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        DocumentSnapshot document = task.getResult();
                        if (document.exists()) {
                            showTeacherInfo(document);
                            loadAssignedStudents(email);
                        } else {
                            hideInfoViews();
                            Toast.makeText(this, "Teacher not found", Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        Toast.makeText(this, "Error: " + task.getException(), Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void showTeacherInfo(DocumentSnapshot document) {
        // Get teacher data
        String name = document.getString("name");
        String phone = document.getString("phone");
        String dept = document.getString("department");
        String address = document.getString("address");
        String profileImage = document.getString("profileImage");

        // Build info string
        StringBuilder info = new StringBuilder();
        info.append("Name: ").append(getValueOrNA(name)).append("\n\n");
        info.append("Phone: ").append(getValueOrNA(phone)).append("\n\n");
        info.append("Department: ").append(getValueOrNA(dept)).append("\n\n");
        info.append("Address: ").append(getValueOrNA(address));

        etTeacherInfo.setText(info.toString());
        infoCard.setVisibility(View.VISIBLE);
        profileCard.setVisibility(View.VISIBLE);

        // Handle profile image
        if (profileImage != null && !profileImage.isEmpty()) {
            try {
                String imageData = profileImage.contains(",") ?
                        profileImage.split(",")[1] : profileImage;
                byte[] decodedBytes = Base64.decode(imageData, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
                ivProfile.setImageBitmap(bitmap);
            } catch (IllegalArgumentException e) {
                ivProfile.setImageResource(R.drawable.ic_outline_person_24);
                e.printStackTrace();
            }
        } else {
            ivProfile.setImageResource(R.drawable.ic_outline_person_24);
        }
    }

    private void loadAssignedStudents(String teacherEmail) {
        db.collection("teachers")
                .document(teacherEmail)
                .collection("assignedstudents")
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        assignedStudentsList.clear();
                        for (QueryDocumentSnapshot document : task.getResult()) {
                            assignedStudentsList.add(document.getId());
                        }
                        adapter.notifyDataSetChanged();

                        if (assignedStudentsList.isEmpty()) {
                            assignedStudentsCard.setVisibility(View.GONE);
                        } else {
                            assignedStudentsCard.setVisibility(View.VISIBLE);
                        }
                    } else {
                        Toast.makeText(this, "Error loading assigned students: " + task.getException(),
                                Toast.LENGTH_SHORT).show();
                        assignedStudentsCard.setVisibility(View.GONE);
                    }
                });
    }

    private String getValueOrNA(String value) {
        return (value != null && !value.isEmpty()) ? value : "N/A";
    }

    private void hideInfoViews() {
        infoCard.setVisibility(View.GONE);
        profileCard.setVisibility(View.GONE);
        assignedStudentsCard.setVisibility(View.GONE);
    }

    // RecyclerView Adapter
    private static class AssignedStudentsAdapter extends RecyclerView.Adapter<AssignedStudentsAdapter.ViewHolder> {
        private final List<String> studentsList;

        public AssignedStudentsAdapter(List<String> studentsList) {
            this.studentsList = studentsList;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_assigned_student, parent, false);
            return new ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            holder.tvStudentEmail.setText(studentsList.get(position));
        }

        @Override
        public int getItemCount() {
            return studentsList.size();
        }

        static class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvStudentEmail;

            public ViewHolder(@NonNull View itemView) {
                super(itemView);
                tvStudentEmail = itemView.findViewById(R.id.tvStudentEmail);
            }
        }
    }
}