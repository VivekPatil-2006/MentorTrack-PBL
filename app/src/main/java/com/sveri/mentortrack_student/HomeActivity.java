package com.sveri.mentortrack_student;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.cardview.widget.CardView;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.viewpager2.widget.ViewPager2;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.components.LimitLine;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.utils.ColorTemplate;
import com.google.android.material.navigation.NavigationView;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class HomeActivity extends AppCompatActivity {

    DrawerLayout drawerLayout;
    NavigationView navigationView;
    Toolbar toolbar;

    private FirebaseFirestore db;
    private SharedPreferences prefs;
    private String email;

    private TextView userNameTextView;
    private ImageView profileImageView;

    // Mentor Info Views
    private TextView mentorNameTextView, mentorEmailTextView, mentorDeptTextView, mentorPhoneTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        drawerLayout = findViewById(R.id.drawerLayout);
        navigationView = findViewById(R.id.navigationView);
        toolbar = findViewById(R.id.toolbar);

        setSupportActionBar(toolbar);

        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, drawerLayout, toolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawerLayout.addDrawerListener(toggle);
        toggle.syncState();

        // Get SharedPreferences and email
        prefs = getSharedPreferences("MyPrefs", Context.MODE_PRIVATE);
        email = prefs.getString("email", null);

        if (email == null) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        // Header View
        View headerView = navigationView.getHeaderView(0);
        userNameTextView = headerView.findViewById(R.id.userName);
        profileImageView = headerView.findViewById(R.id.profileImage);

        // Mentor TextViews
        mentorNameTextView = findViewById(R.id.mentorName);
        mentorEmailTextView = findViewById(R.id.mentorEmail);
        mentorDeptTextView = findViewById(R.id.mentorDept);
        mentorPhoneTextView = findViewById(R.id.mentorPhone);

        db = FirebaseFirestore.getInstance();
        loadUserInfo();

        navigationView.setNavigationItemSelectedListener(item -> {
            int id = item.getItemId();

            if (id == R.id.nav_home) {
                // Stay on HomeActivity
            } else if (id == R.id.nav_profile) {
                startActivity(new Intent(getApplicationContext(), ProfileActivity.class));
            } else if (id == R.id.nav_chat) {
                 startActivity(new Intent(getApplicationContext(), ChatActivity.class));
            } else if (id == R.id.nav_change_password) {
                startActivity(new Intent(getApplicationContext(), ChangePasswordActivity.class));
            }else if (id == R.id.nav_feedback) {
                startActivity(new Intent(getApplicationContext(), FeedbackActivity.class));
            } else if (id == R.id.nav_logout) {
                startActivity(new Intent(getApplicationContext(), LoginActivity.class));
                finish();
            }

            drawerLayout.closeDrawers();
            return true;
        });
    }

    private void loadUserInfo() {
        db.collection("students").document(email).get().addOnSuccessListener(studentSnapshot -> {
            if (studentSnapshot.exists()) {
                String name = studentSnapshot.getString("name");
                String base64Image = studentSnapshot.getString("profileImage");

                if (name != null) {
                    userNameTextView.setText(name);
                }

                if (base64Image != null && !base64Image.isEmpty()) {
                    byte[] imageBytes = Base64.decode(base64Image, Base64.DEFAULT);
                    Bitmap bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
                    profileImageView.setImageBitmap(bitmap);
                }


                // ✅ Fetch mentor details
                String mentorEmail = studentSnapshot.getString("mentoremail");

                if (mentorEmail != null && !mentorEmail.isEmpty()) {
                    db.collection("teachers").document(mentorEmail).get()
                            .addOnSuccessListener(mentorSnapshot -> {
                                if (mentorSnapshot.exists()) {
                                    Log.d("DEBUG", "Mentor Document: " + mentorSnapshot.getData());

                                    String mentorName = mentorSnapshot.getString("name");
                                    String mentorDepartment = mentorSnapshot.getString("department");
                                    String mentorPhone = mentorSnapshot.getString("phone");

                                    TextView mentorNameText = findViewById(R.id.mentorName);
                                    TextView mentorEmailText = findViewById(R.id.mentorEmail);
                                    TextView mentorDeptText = findViewById(R.id.mentorDept);
                                    TextView mentorPhoneText = findViewById(R.id.mentorPhone);

                                    mentorNameText.setText("Mentor Name : "+mentorName);
                                    mentorEmailText.setText("Email : "+mentorEmail);
                                    mentorDeptText.setText("Department :"+mentorDepartment);
                                    mentorPhoneText.setText("Phone No : "+mentorPhone);
                                } else {
                                    Log.e("DEBUG", "Mentor document does NOT exist for: " + mentorEmail);
                                }
                            })
                            .addOnFailureListener(e -> {
                                Log.e("DEBUG", "Failed to fetch mentor document", e);
                            });
                }
            }
        }).addOnFailureListener(e -> {
            userNameTextView.setText("Student Name");
        });

//        BarChart barChart = findViewById(R.id.barChart);


//        LinearLayout chartContainer = findViewById(R.id.chartContainer); // Make sure this exists in XML

//        LinearLayout chartContainer = findViewById(R.id.chartContainer);

        List<ExamData> examDataList = new ArrayList<>();

        db.collection("students").document(email)
                .collection("exam")
                .get()
                .addOnSuccessListener(querySnapshot -> {
                    for (DocumentSnapshot examDoc : querySnapshot.getDocuments()) {
                        String examName = examDoc.getId();
                        Map<String, Object> marksMap = examDoc.getData();

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
                                Log.e("ChartError", "Invalid mark: " + entry.getKey());
                            }
                        }

                        examDataList.add(new ExamData(examName, marksMap));
                    }

                    ReportPagerAdapter adapter = new ReportPagerAdapter(this, examDataList);
                    ViewPager2 reportPager = findViewById(R.id.reportPager);
                    reportPager.setAdapter(adapter);
                });

    }

}
