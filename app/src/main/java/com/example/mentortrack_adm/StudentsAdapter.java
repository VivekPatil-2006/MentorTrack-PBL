package com.example.mentortrack_adm;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.List;

public class StudentsAdapter extends RecyclerView.Adapter<StudentsAdapter.StudentViewHolder> {

    private List<Student> studentsList;
    private List<Student> selectedStudents = new ArrayList<>();
    private boolean selectAll = false;

    public interface OnSelectionChangeListener {
        void onSelectionChanged(int selectedCount);
    }
    private OnSelectionChangeListener selectionListener;

    public StudentsAdapter(List<Student> studentsList, OnSelectionChangeListener listener) {
        this.studentsList = studentsList;
        this.selectionListener = listener;
    }

    public void setSelectAll(boolean selectAll) {
        this.selectAll = selectAll;
        selectedStudents.clear();
        if (selectAll) {
            for (Student student : studentsList) {
                if (student.getMentoremail() == null || student.getMentoremail().isEmpty()) {
                    selectedStudents.add(student);
                }
            }
        }
        notifyDataSetChanged();
        if (selectionListener != null) {
            selectionListener.onSelectionChanged(selectedStudents.size());
        }
    }

    @NonNull
    @Override
    public StudentViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.student_item, parent, false);
        return new StudentViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull StudentViewHolder holder, int position) {
        Student student = studentsList.get(position);

        holder.nameText.setText(student.getName());

        // Disable checkbox if student already has a mentor
        boolean hasMentor = student.getMentoremail() != null && !student.getMentoremail().isEmpty();
        holder.checkBox.setEnabled(!hasMentor);

        if (hasMentor) {
            holder.mentorText.setText("Mentor: " + student.getMentoremail());
            holder.checkBox.setChecked(false);
        } else {
            holder.mentorText.setText("No mentor assigned");
            holder.checkBox.setChecked(selectAll || selectedStudents.contains(student));
        }

        holder.checkBox.setOnCheckedChangeListener(null); // Clear previous listener
        holder.checkBox.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                selectedStudents.add(student);
            } else {
                selectedStudents.remove(student);
            }
            if (selectionListener != null) {
                selectionListener.onSelectionChanged(selectedStudents.size());
            }
        });
    }

    @Override
    public int getItemCount() {
        return studentsList.size();
    }

    public List<Student> getSelectedStudents() {
        return selectedStudents;
    }

    public static class StudentViewHolder extends RecyclerView.ViewHolder {
        CheckBox checkBox;
        TextView nameText;
        TextView mentorText;

        public StudentViewHolder(@NonNull View itemView) {
            super(itemView);
            checkBox = itemView.findViewById(R.id.studentCheckbox);
            nameText = itemView.findViewById(R.id.studentNameText);
            mentorText = itemView.findViewById(R.id.studentMentorText);
        }
    }
}