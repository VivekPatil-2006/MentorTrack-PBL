package com.example.mentortrack_teacher;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.util.Base64;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StudentProfileActivity extends AppCompatActivity {

    TextView name, rollNo, phone, parentphone, batch, division, department, address, email, mentorEmail, password, year;
    ImageView imageProfile, imageFeedback;
    FirebaseFirestore db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_student_profile);

        // Bind views
        imageProfile = findViewById(R.id.student_image);
        imageFeedback = findViewById(R.id.feedback_icon);
        name = findViewById(R.id.student_name);
        rollNo = findViewById(R.id.student_rollno);
        phone = findViewById(R.id.student_phonenumber);
        parentphone = findViewById(R.id.student_parentphone);
        batch = findViewById(R.id.student_batch);
        division = findViewById(R.id.student_division);
        department = findViewById(R.id.student_department);
        address = findViewById(R.id.student_address);
        email = findViewById(R.id.student_email);
        mentorEmail = findViewById(R.id.student_mentoremail);
        year = findViewById(R.id.student_year);
        password = findViewById(R.id.student_password);

        db = FirebaseFirestore.getInstance();

        String studentEmail = getIntent().getStringExtra("email");

        if (studentEmail != null) {
            loadStudentProfile(studentEmail);
        } else {
            Toast.makeText(this, "Student email not found", Toast.LENGTH_SHORT).show();
            finish();
        }

        // Set click listener for feedback image
        imageFeedback.setOnClickListener(v -> {
            if (studentEmail != null) {
                Intent intent = new Intent(StudentProfileActivity.this, SendMessageActivity.class);
                intent.putExtra("email", studentEmail);
                startActivity(intent);
            } else {
                Toast.makeText(this, "Student email not found", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void loadStudentProfile(String studentEmail) {
        db.collection("students").document(studentEmail)
                .get()
                .addOnSuccessListener(doc -> {
                    if (doc.exists()) {
                        name.setText(doc.getString("name"));
                        rollNo.setText("Roll No: " + doc.getString("rollno"));
                        phone.setText("Phone: " + doc.getString("phonenumber"));
                        parentphone.setText("Parent Phone: " + doc.getString("parentphone"));
                        batch.setText("Batch: " + doc.getString("batch"));
                        division.setText("Division: " + doc.getString("division"));
                        department.setText("Department: " + doc.getString("department"));
                        address.setText("Address: " + doc.getString("address"));
                        email.setText("Email: " + doc.getString("email"));
                        mentorEmail.setText("Mentor Email: " + doc.getString("mentoremail"));
                        year.setText("Year: " + doc.getString("year"));
                        password.setText("Password: " + doc.getString("password"));

                        String profileImageBase64 = doc.getString("profileImage");
                        if (profileImageBase64 != null && !profileImageBase64.isEmpty()) {
                            try {
                                byte[] decodedString = Base64.decode(profileImageBase64, Base64.DEFAULT);
                                Bitmap decodedByte = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                                imageProfile.setImageBitmap(decodedByte);
                            } catch (Exception e) {
                                Toast.makeText(this, "Error loading image", Toast.LENGTH_SHORT).show();
                            }
                        }

                        loadExamData(studentEmail);
                    } else {
                        Toast.makeText(this, "Student not found", Toast.LENGTH_SHORT).show();
                    }
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "Error loading student profile", Toast.LENGTH_SHORT).show();
                });
    }

    private void loadExamData(String studentEmail) {
        db.collection("students").document(studentEmail).collection("exam")
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    if (!queryDocumentSnapshots.isEmpty()) {
                        LinearLayout chartContainer = findViewById(R.id.chart_container);

                        for (DocumentSnapshot examDoc : queryDocumentSnapshots.getDocuments()) {
                            Map<String, Object> marksMap = examDoc.getData();

                            if (marksMap != null && !marksMap.isEmpty()) {
                                List<BarEntry> entries = new ArrayList<>();
                                List<String> labels = new ArrayList<>();
                                int index = 0;

                                for (Map.Entry<String, Object> entry : marksMap.entrySet()) {
                                    try {
                                        float mark = Float.parseFloat(entry.getValue().toString());
                                        entries.add(new BarEntry(index, mark));
                                        labels.add(entry.getKey());
                                        index++;
                                    } catch (NumberFormatException e) {
                                        // Skip invalid data
                                    }
                                }

                                if (entries.isEmpty()) continue;

                                // Create and configure BarChart
                                BarChart chart = new BarChart(this);
                                BarDataSet dataSet = new BarDataSet(entries, "Marks");
                                dataSet.setColor(getResources().getColor(R.color.teal_700, getTheme()));

                                BarData data = new BarData(dataSet);
                                data.setBarWidth(0.9f);

                                chart.setData(data);
                                chart.setFitBars(true);
                                chart.setDrawValueAboveBar(true);
                                chart.getDescription().setText("Exam: " + examDoc.getId());
                                chart.getDescription().setTextSize(12f);

                                XAxis xAxis = chart.getXAxis();
                                xAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
                                xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
                                xAxis.setGranularity(1f);
                                xAxis.setLabelCount(labels.size());
                                xAxis.setDrawGridLines(false);
                                xAxis.setLabelRotationAngle(45f);

                                YAxis leftAxis = chart.getAxisLeft();
                                leftAxis.setAxisMinimum(0f);
                                chart.getAxisRight().setEnabled(false);

                                chart.setLayoutParams(new LinearLayout.LayoutParams(
                                        LinearLayout.LayoutParams.MATCH_PARENT,
                                        600)); // Adjust chart height

                                chart.animateY(1000);
                                chart.invalidate();

                                chartContainer.addView(chart);
                            }
                        }
                    } else {
                        Toast.makeText(this, "No exams available for this student", Toast.LENGTH_SHORT).show();
                    }
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "Failed to load exam data", Toast.LENGTH_SHORT).show();
                });
    }
}
