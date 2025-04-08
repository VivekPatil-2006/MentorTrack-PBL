package com.example.mentortrack_adm;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.ProgressBar;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import java.util.ArrayList;
import java.util.List;

public class DetailsFragment extends Fragment implements TeachersAdapter.OnTeacherClickListener {

    private AutoCompleteTextView departmentDropdown;
    private RecyclerView teachersRecyclerView;
    private TeachersAdapter teachersAdapter;
    private List<Teacher> teachersList;
    private FirebaseFirestore db;
    private SharedPreferences sharedPreferences;
    private ProgressBar progressBar;
    private static final String SHARED_PREFS = "MentorTrackPrefs";
    private static final String DEPARTMENT_KEY = "selected_department";

    public DetailsFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_details, container, false);

        sharedPreferences = requireActivity().getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE);

        db = FirebaseFirestore.getInstance();
        teachersList = new ArrayList<>();

        departmentDropdown = view.findViewById(R.id.departmentDropdown);
        teachersRecyclerView = view.findViewById(R.id.teachersRecyclerView);
        progressBar = view.findViewById(R.id.progressBar);

        String[] departments = new String[]{"Computer", "IT", "ENTC", "AIDS", "ECE"};
        ArrayAdapter<String> departmentAdapter = new ArrayAdapter<>(
                requireContext(),
                R.layout.dropdown_item,
                departments
        );
        departmentDropdown.setAdapter(departmentAdapter);

        teachersRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        teachersAdapter = new TeachersAdapter(teachersList, this);
        teachersRecyclerView.setAdapter(teachersAdapter);

        departmentDropdown.setOnItemClickListener((parent, view1, position, id) -> {
            String selectedDept = (String) parent.getItemAtPosition(position);
            loadTeachersByDepartment(selectedDept);

            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putString(DEPARTMENT_KEY, selectedDept);
            editor.apply();
        });

        return view;
    }

    private void loadTeachersByDepartment(String department) {
        progressBar.setVisibility(View.VISIBLE);
        teachersRecyclerView.setVisibility(View.GONE);

        db.collection("teachers")
                .whereEqualTo("department", department)
                .get()
                .addOnCompleteListener(task -> {
                    progressBar.setVisibility(View.GONE);
                    teachersRecyclerView.setVisibility(View.VISIBLE);

                    if (task.isSuccessful()) {
                        teachersList.clear();
                        for (QueryDocumentSnapshot document : task.getResult()) {
                            Teacher teacher = document.toObject(Teacher.class);
                            teachersList.add(teacher);
                        }
                        teachersAdapter.notifyDataSetChanged();
                    }
                });
    }

    @Override
    public void onTeacherClick(int position) {
        Teacher selectedTeacher = teachersList.get(position);
        Intent intent = new Intent(getActivity(), AssignmentActivity.class);
        intent.putExtra("teacherEmail", selectedTeacher.getEmail());

        String department = sharedPreferences.getString(DEPARTMENT_KEY, "");
        intent.putExtra("department", department);

        startActivity(intent);
    }
}