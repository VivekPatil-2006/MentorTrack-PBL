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
public class SearchFragment extends Fragment {

    public SearchFragment() {
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
        View view = inflater.inflate(R.layout.fragment_search, container, false);

        // Initialize buttons
        Button btnSearchStudents = view.findViewById(R.id.button_search_students);
        Button btnSearchTeachers = view.findViewById(R.id.button_search_teachers);

        // Set click listeners
        btnSearchStudents.setOnClickListener(v -> {
            Intent intent = new Intent(getActivity(), SearchStudentActivity.class);
            startActivity(intent);
        });

        btnSearchTeachers.setOnClickListener(v -> {
            Intent intent = new Intent(getActivity(), SearchTeacherActivity.class);
            startActivity(intent);
        });

        return view;
    }
}
