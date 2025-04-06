package com.sveri.mentortrack_student;

import android.content.Context;
import android.graphics.Color;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.components.LimitLine;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.utils.ColorTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ReportPagerAdapter extends RecyclerView.Adapter<ReportPagerAdapter.ReportViewHolder> {

    private final Context context;
    private final List<ExamData> examList;

    public ReportPagerAdapter(Context context, List<ExamData> examList) {
        this.context = context;
        this.examList = examList;
    }

    @NonNull
    @Override
    public ReportViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_exam_chart, parent, false);
        return new ReportViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ReportViewHolder holder, int position) {
        ExamData exam = examList.get(position);
        String examName = exam.getExamName();
        Map<String, Object> marksMap = exam.getMarks();

        holder.examTitle.setText(examName + " Report");

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
                Log.e("ChartError", "Invalid mark format for " + entry.getKey());
            }
        }

        BarDataSet dataSet = new BarDataSet(entries, "Marks");
        dataSet.setColors(ColorTemplate.MATERIAL_COLORS);
        dataSet.setValueTextSize(12f);
        dataSet.setValueTextColor(Color.BLACK);

        BarData data = new BarData(dataSet);
        holder.barChart.setData(data);

        XAxis xAxis = holder.barChart.getXAxis();
        xAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setGranularity(1f);
        xAxis.setLabelRotationAngle(-45f);
        xAxis.setDrawGridLines(false);
        xAxis.setTextColor(Color.BLACK);
        xAxis.setTextSize(12f);

        YAxis leftAxis = holder.barChart.getAxisLeft();
        leftAxis.setAxisMinimum(0f);
        leftAxis.setAxisMaximum(30f);
        leftAxis.setTextColor(Color.BLACK);
        leftAxis.setTextSize(12f);

        LimitLine passLine = new LimitLine(12f, "Passing Marks");
        passLine.setLineColor(Color.RED);
        passLine.setLineWidth(2f);
        passLine.setTextColor(Color.RED);
        passLine.setTextSize(10f);
        leftAxis.addLimitLine(passLine);

        holder.barChart.getAxisRight().setEnabled(false);
        holder.barChart.getDescription().setEnabled(false);
        holder.barChart.setExtraBottomOffset(10f);
        holder.barChart.animateY(1000);
        holder.barChart.invalidate();
    }

    @Override
    public int getItemCount() {
        return examList.size();
    }

    static class ReportViewHolder extends RecyclerView.ViewHolder {
        TextView examTitle;
        BarChart barChart;
        CardView chartCard;

        public ReportViewHolder(@NonNull View itemView) {
            super(itemView);
            examTitle = itemView.findViewById(R.id.examTitle);
            barChart = itemView.findViewById(R.id.examChart);
            chartCard = itemView.findViewById(R.id.examCard);
        }
    }
}
