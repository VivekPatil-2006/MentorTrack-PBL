package com.example.mentortrack_adm;

import android.content.Intent;
import android.os.Bundle;

import androidx.fragment.app.Fragment;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

/**
 * A simple {@link Fragment} subclass.
 */
public class OperationFragment extends Fragment {

    public OperationFragment() {
        // Required empty public constructor
    }

    public static OperationFragment newInstance(String param1, String param2) {
        OperationFragment fragment = new OperationFragment();
        Bundle args = new Bundle();
        args.putString("param1", param1);
        args.putString("param2", param2);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_operation, container, false);

        // Initialize buttons
        Button btnAddStudents = view.findViewById(R.id.button_add_students);
        Button btnAddTeachers = view.findViewById(R.id.button_add_teachers);

        // Set click listeners
        btnAddStudents.setOnClickListener(v -> {
            Intent intent = new Intent(getActivity(), AddStudentsActivity.class);
            startActivity(intent);
        });

        btnAddTeachers.setOnClickListener(v -> {
            Intent intent = new Intent(getActivity(), AddTeachersActivity.class);
            startActivity(intent);
        });

        return view;
    }
}
