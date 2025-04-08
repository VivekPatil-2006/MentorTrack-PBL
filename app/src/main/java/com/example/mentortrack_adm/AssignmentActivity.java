package com.example.mentortrack_adm;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AssignmentActivity extends AppCompatActivity
        implements StudentsAdapter.OnSelectionChangeListener {

    private EditText departmentEditText, batchEditText;
    private AutoCompleteTextView yearDropdown;
    private RecyclerView studentsRecyclerView;
    private ProgressBar progressBar;
    private StudentsAdapter studentsAdapter;
    private List<Student> studentsList;
    private FirebaseFirestore db;
    private TextView selectedTeacherText;
    private String teacherEmail;
    private Button assignButton;
    private CheckBox selectAllCheckbox;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_assignment);

        // Initialize views
        departmentEditText = findViewById(R.id.departmentEditText);
        yearDropdown = findViewById(R.id.yearDropdown);
        batchEditText = findViewById(R.id.batchEditText);
        studentsRecyclerView = findViewById(R.id.studentsRecyclerView);
        progressBar = findViewById(R.id.progressBar);
        Button filterButton = findViewById(R.id.filterButton);
        selectedTeacherText = findViewById(R.id.selectedTeacherText);
        assignButton = findViewById(R.id.assignButton);
        selectAllCheckbox = findViewById(R.id.selectAllCheckbox);

        // Get teacher info from intent
        teacherEmail = getIntent().getStringExtra("teacherEmail");
        String department = getIntent().getStringExtra("department");

        if (teacherEmail != null && !teacherEmail.isEmpty()) {
            selectedTeacherText.setText("Selected Teacher: " + teacherEmail);
        }

        // Initialize Firestore
        db = FirebaseFirestore.getInstance();
        studentsList = new ArrayList<>();

        // Setup RecyclerView
        studentsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        studentsAdapter = new StudentsAdapter(studentsList, this);
        studentsRecyclerView.setAdapter(studentsAdapter);

        // Set department from intent
        departmentEditText.setText(department);

        // Setup year dropdown
        String[] years = new String[]{"First Year", "Second Year", "Third Year", "Final Year"};
        ArrayAdapter<String> yearAdapter = new ArrayAdapter<>(
                this,
                R.layout.dropdown_item,
                years
        );
        yearDropdown.setAdapter(yearAdapter);

        // Initialize Select All checkbox
        selectAllCheckbox.setOnCheckedChangeListener((buttonView, isChecked) -> {
            studentsAdapter.setSelectAll(isChecked);
        });

        // Filter button click listener
        filterButton.setOnClickListener(v -> filterStudents());

        // Assign button click listener
        assignButton.setOnClickListener(v -> assignStudentsToTeacher());

        // Initially hide the assign button
        assignButton.setVisibility(View.GONE);
    }

    private void filterStudents() {
        String department = departmentEditText.getText().toString().trim();
        String year = yearDropdown.getText().toString().trim();
        String batch = batchEditText.getText().toString().trim();

        if (department.isEmpty() || year.isEmpty() || batch.isEmpty()) {
            Toast.makeText(this, "Please select all filters", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        studentsRecyclerView.setVisibility(View.GONE);
        assignButton.setVisibility(View.GONE);
        selectAllCheckbox.setChecked(false);

        db.collection("students")
                .whereEqualTo("department", department)
                .whereEqualTo("year", year)
                .whereEqualTo("batch", batch)
                .get()
                .addOnCompleteListener(task -> {
                    progressBar.setVisibility(View.GONE);
                    studentsRecyclerView.setVisibility(View.VISIBLE);

                    if (task.isSuccessful()) {
                        studentsList.clear();
                        for (QueryDocumentSnapshot document : task.getResult()) {
                            Student student = document.toObject(Student.class);
                            student.setId(document.getId());
                            studentsList.add(student);
                        }
                        studentsAdapter.notifyDataSetChanged();

                        if (studentsList.isEmpty()) {
                            Toast.makeText(this, "No students found", Toast.LENGTH_SHORT).show();
                            assignButton.setVisibility(View.GONE);
                        }
                    } else {
                        Toast.makeText(this, "Error loading students", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    @Override
    public void onSelectionChanged(int selectedCount) {
        // Update Select All checkbox state
        selectAllCheckbox.setOnCheckedChangeListener(null);
        if (selectedCount == getSelectableStudentCount()) {
            selectAllCheckbox.setChecked(true);
        } else if (selectedCount == 0) {
            selectAllCheckbox.setChecked(false);
        } else {
            selectAllCheckbox.setChecked(false);
        }
        selectAllCheckbox.setOnCheckedChangeListener((buttonView, isChecked) -> {
            studentsAdapter.setSelectAll(isChecked);
        });

        // Show/hide assign button based on selection
        assignButton.setVisibility(selectedCount > 0 ? View.VISIBLE : View.GONE);
    }

    private int getSelectableStudentCount() {
        int count = 0;
        for (Student student : studentsList) {
            if (student.getMentoremail() == null || student.getMentoremail().isEmpty()) {
                count++;
            }
        }
        return count;
    }

    private void assignStudentsToTeacher() {
        if (teacherEmail == null || teacherEmail.isEmpty()) {
            Toast.makeText(this, "Teacher email not available", Toast.LENGTH_SHORT).show();
            return;
        }

        List<Student> selectedStudents = studentsAdapter.getSelectedStudents();
        if (selectedStudents.isEmpty()) {
            Toast.makeText(this, "Please select at least one student", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        assignButton.setEnabled(false);

        final int[] successCount = {0};
        final int totalStudents = selectedStudents.size();

        for (Student student : selectedStudents) {
            // Update student document with mentor email
            Map<String, Object> studentUpdates = new HashMap<>();
            studentUpdates.put("mentoremail", teacherEmail);

            // Create reference to teacher's assignedstudents collection
            DocumentReference teacherStudentRef = db.collection("teachers")
                    .document(teacherEmail)
                    .collection("assignedstudents")
                    .document(student.getEmail());

            // Create student data to store in teacher's collection
            Map<String, Object> studentData = new HashMap<>();
            studentData.put("email", student.getEmail());
            studentData.put("name", student.getName());

            // Perform both operations
            db.runTransaction(transaction -> {
                // Update student document
                transaction.update(db.collection("students").document(student.getEmail()), studentUpdates);

                // Add to teacher's assignedstudents collection
                transaction.set(teacherStudentRef, studentData);

                return null;
            }).addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    successCount[0]++;
                    if (successCount[0] == totalStudents) {
                        progressBar.setVisibility(View.GONE);
                        assignButton.setEnabled(true);
                        Toast.makeText(AssignmentActivity.this,
                                "Successfully assigned " + successCount[0] + " students",
                                Toast.LENGTH_SHORT).show();
                        // Refresh the list
                        filterStudents();
                    }
                } else {
                    progressBar.setVisibility(View.GONE);
                    assignButton.setEnabled(true);
                    Toast.makeText(AssignmentActivity.this,
                            "Error assigning student: " + student.getName(),
                            Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}