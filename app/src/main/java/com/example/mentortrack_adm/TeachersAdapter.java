package com.example.mentortrack_adm;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class TeachersAdapter extends RecyclerView.Adapter<TeachersAdapter.TeacherViewHolder> {

    private List<Teacher> teachersList;
    private OnTeacherClickListener listener;

    public interface OnTeacherClickListener {
        void onTeacherClick(int position);
    }

    public TeachersAdapter(List<Teacher> teachersList, OnTeacherClickListener listener) {
        this.teachersList = teachersList;
        this.listener = listener;
    }

    @NonNull
    @Override
    public TeacherViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(android.R.layout.simple_list_item_1, parent, false);
        return new TeacherViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull TeacherViewHolder holder, int position) {
        Teacher teacher = teachersList.get(position);
        holder.teacherName.setText(teacher.getName());

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onTeacherClick(position);
            }
        });
    }

    @Override
    public int getItemCount() {
        return teachersList.size();
    }

    static class TeacherViewHolder extends RecyclerView.ViewHolder {
        TextView teacherName;

        public TeacherViewHolder(@NonNull View itemView) {
            super(itemView);
            teacherName = itemView.findViewById(android.R.id.text1);
        }
    }
}