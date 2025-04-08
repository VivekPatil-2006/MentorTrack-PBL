package com.example.mentortrack_teacher;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.ArrayList;

public class DashboardActivity extends AppCompatActivity {

    RecyclerView recyclerView;
    StudentAdapter adapter;
    ArrayList<Student> students;
    FirebaseFirestore db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        recyclerView = findViewById(R.id.recyclerViewStudents);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        students = new ArrayList<>();
        adapter = new StudentAdapter(this, students);
        recyclerView.setAdapter(adapter);

        db = FirebaseFirestore.getInstance();

        loadAssignedStudents();
    }

    private void loadAssignedStudents() {
        // Get the logged-in email from SharedPreferences
        SharedPreferences prefs = getSharedPreferences("MentorPrefs", Context.MODE_PRIVATE);
        String mentorEmail = prefs.getString("email", null);

        if (mentorEmail == null) {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_SHORT).show();
            finish(); // Close activity if not logged in
            return;
        }

        CollectionReference assignedStudentsRef = db.collection("teachers")
                .document(mentorEmail)
                .collection("assignedstudents");

        assignedStudentsRef.get().addOnSuccessListener(queryDocumentSnapshots -> {
            students.clear();
            for (DocumentSnapshot doc : queryDocumentSnapshots) {
                String email = doc.getId();
                String name = doc.getString("name");
                students.add(new Student(name, email));
            }
            adapter.notifyDataSetChanged();
        }).addOnFailureListener(e -> {
            Toast.makeText(this, "Failed to load assigned students", Toast.LENGTH_SHORT).show();
        });
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_dashboard, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.menu_profile) {
            startActivity(new Intent(this, AdminProfileActivity.class));
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
