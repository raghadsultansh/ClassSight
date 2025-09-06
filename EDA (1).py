import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

# Load and preprocess data

import pandas as pd
import plotly.express as px
import pandas as pd
import plotly.express as px

df = pd.read_csv("/Users/khalid/DS_Projects/rag/Synthetic_Half-Hour_Attendance___Attention_Data__Sun_Thu_.csv")

# Convert date & time - FIXED VERSION
df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d")

# Convert time strings to datetime objects first, then combine with date
df["start_datetime"] = pd.to_datetime(df["date"].astype(str) + " " + df["start_time"].astype(str))
df["end_datetime"] = pd.to_datetime(df["date"].astype(str) + " " + df["end_time"].astype(str))

# Create additional time-based features
df["week"] = df["date"].dt.isocalendar().week
df["time_label"] = df["start_datetime"].dt.strftime("%H:%M")

# Use the datetime column for floor operation with 'min' instead of 'T'
df["half_hour"] = df["start_datetime"].dt.floor("30min")

# Filter for allowed time range: 10–12 and 1–3
mask = ((df["half_hour"].dt.hour.between(10, 12)) |
        (df["half_hour"].dt.hour.between(13, 15)))
filtered = df.loc[mask].copy()
filtered["time_label"] = filtered["half_hour"].dt.strftime("%-I:%M")
filtered["time_label"] = filtered["time_label"].str.replace(":00", "", regex=False)

# Define time order for consistent x-axis
time_order = ["10", "10:30", "11", "11:30", "12", "1", "1:30", "2", "2:30", "3"]

# =============================================================================
# ATTENDANCE ANALYSIS
# =============================================================================

# ---------------------------
# HOURLY (HALF-HOUR PLOTTING FOR ONE DAY)
# ---------------------------
target_day = pd.to_datetime("2025-08-10")
df_day = df[df["date"] == target_day].copy()

# Use start_datetime instead of datetime for sorting
df_day = df_day.sort_values("start_datetime")

fig_hourly = px.line(
    df_day,
    x="time_label",
    y="attendance_pct",
    title=f"🕧 Half-Hourly Attendance % on {target_day.date()}",
    markers=True,
    labels={"time_label": "Time Slot (30-min)", "attendance_pct": "Attendance %"},
    hover_data={"attendance_pct": ":.2f", "students_enrolled": True, "avg_students_no": True},
    color_discrete_sequence=["#2E86AB"]
)

min_idx = df_day["attendance_pct"].idxmin()
max_idx = df_day["attendance_pct"].idxmax()

for idx, label in [(min_idx, "Min"), (max_idx, "Max")]:
    fig_hourly.add_annotation(
        x=df_day.loc[idx, "time_label"],
        y=df_day.loc[idx, "attendance_pct"],
        text=f"{label}: {df_day.loc[idx, 'attendance_pct']}%",
        showarrow=True,
        arrowhead=2,
        ax=0,
        ay=-30,
        font=dict(color="black")
    )

fig_hourly.add_annotation(
    x=df_day["time_label"].iloc[-1],
    y=df_day["attendance_pct"].mean(),
    text=f"Mean: {df_day['attendance_pct'].mean():.1f}%",
    showarrow=False,
    font=dict(size=13, color="gray"),
    bgcolor="#e0e0e0",
    opacity=0.7
)

fig_hourly.update_traces(line=dict(width=3), marker=dict(size=7))
fig_hourly.update_layout(
    template="plotly_white",
    plot_bgcolor="#F8F9FA",
    paper_bgcolor="#F8F9FA",
    font=dict(size=14),
    xaxis=dict(showgrid=True, gridcolor="#E0E0E0", tickangle=45),
    yaxis=dict(showgrid=True, gridcolor="#E0E0E0"),
    title_font=dict(size=20),
    hovermode="x unified",
    margin=dict(t=70, b=80)
)

# Show the plot
fig_hourly.show()
# ---------------------------
# DAILY AVERAGE ATTENDANCE
# ---------------------------
df_daily = df.groupby("date", as_index=False)["attendance_pct"].mean()
min_idx_d = df_daily["attendance_pct"].idxmin()
max_idx_d = df_daily["attendance_pct"].idxmax()

fig_daily = px.line(
    df_daily,
    x="date",
    y="attendance_pct",
    title="📅 Daily Average Attendance %",
    markers=True,
    labels={"date": "Date", "attendance_pct": "Attendance %"},
    hover_data={"attendance_pct": ":.2f"},
    color_discrete_sequence=["#636EFA"]
)

for idx, label in [(min_idx_d, "Min"), (max_idx_d, "Max")]:
    fig_daily.add_annotation(
        x=df_daily.loc[idx, "date"],
        y=df_daily.loc[idx, "attendance_pct"],
        text=f"{label}: {df_daily.loc[idx, 'attendance_pct']:.1f}%",
        showarrow=True,
        arrowhead=2,
        ax=0,
        ay=-30,
        font=dict(color="black")
    )

fig_daily.add_annotation(
    x=df_daily["date"].iloc[-1],
    y=df_daily["attendance_pct"].mean(),
    text=f"Mean: {df_daily['attendance_pct'].mean():.1f}%",
    showarrow=False,
    font=dict(size=13, color="gray"),
    bgcolor="#e0e0e0",
    opacity=0.7
)

fig_daily.update_traces(line=dict(width=3), marker=dict(size=6))
fig_daily.update_layout(
    template="plotly_white",
    plot_bgcolor="#F8F9FA",
    paper_bgcolor="#F8F9FA",
    font=dict(size=14),
    xaxis=dict(showgrid=True, gridcolor="#DCDCDC"),
    yaxis=dict(showgrid=True, gridcolor="#DCDCDC"),
    title_font=dict(size=20),
    hovermode="x unified",
    margin=dict(t=70, b=60)
)

# ---------------------------
# WEEKLY AVERAGE ATTENDANCE
# ---------------------------
df_weekly = df.groupby("week", as_index=False)["attendance_pct"].mean()
min_idx_w = df_weekly["attendance_pct"].idxmin()
max_idx_w = df_weekly["attendance_pct"].idxmax()

fig_weekly = px.line(
    df_weekly,
    x="week",
    y="attendance_pct",
    title="📊 Weekly Average Attendance %",
    markers=True,
    labels={"week": "Week #", "attendance_pct": "Attendance %"},
    hover_data={"attendance_pct": ":.2f"},
    color_discrete_sequence=["#EF553B"]
)

for idx, label in [(min_idx_w, "Min"), (max_idx_w, "Max")]:
    fig_weekly.add_annotation(
        x=df_weekly.loc[idx, "week"],
        y=df_weekly.loc[idx, "attendance_pct"],
        text=f"{label}: {df_weekly.loc[idx, 'attendance_pct']:.1f}%",
        showarrow=True,
        arrowhead=2,
        ax=0,
        ay=-30,
        font=dict(color="black")
    )

fig_weekly.add_annotation(
    x=df_weekly["week"].iloc[-1],
    y=df_weekly["attendance_pct"].mean(),
    text=f"Mean: {df_weekly['attendance_pct'].mean():.1f}%",
    showarrow=False,
    font=dict(size=13, color="gray"),
    bgcolor="#f3f3f3",
    opacity=0.7
)

fig_weekly.update_traces(line=dict(width=3), marker=dict(size=7))
fig_weekly.update_layout(
    template="plotly_white",
    plot_bgcolor="#F8F9FA",
    paper_bgcolor="#F8F9FA",
    font=dict(size=14),
    xaxis=dict(showgrid=True, gridcolor="#DCDCDC"),
    yaxis=dict(showgrid=True, gridcolor="#DCDCDC"),
    title_font=dict(size=20),
    hovermode="x unified",
    margin=dict(t=70, b=60)
)

# =============================================================================
# STUDENT COUNT ANALYSIS
# =============================================================================

# ---------------------------
# 1. DAILY AVERAGE (MAX STUDENTS)
# ---------------------------
df_daily_max = df.groupby("date", as_index=False)["max_students_no"].mean()

fig_daily_max = px.bar(
    df_daily_max,
    x="date",
    y="max_students_no",
    title="📅 Daily Average Max Students",
    labels={"date": "Date", "max_students_no": "Average Max Students"},
    color_discrete_sequence=["#1f77b4"]
)
fig_daily_max.add_hline(y=df_daily_max["max_students_no"].mean(), line_dash="dash", line_color="black",
                        annotation_text="Overall Mean", annotation_position="top left")

fig_daily_max.update_layout(
    template="plotly_white",
    yaxis_title="Average Max Students",
    xaxis_title="Date",
    bargap=0.2
)

# ---------------------------
# 2. WEEKLY AVERAGE (MAX STUDENTS)
# ---------------------------
df_weekly_max = df.groupby("week", as_index=False)["max_students_no"].mean()

fig_weekly_max = px.bar(
    df_weekly_max,
    x="week",
    y="max_students_no",
    title="📈 Weekly Average Max Students",
    labels={"week": "Week Number", "max_students_no": "Average Max Students"},
    color_discrete_sequence=["#2ca02c"]
)
fig_weekly_max.add_hline(y=df_weekly_max["max_students_no"].mean(), line_dash="dash", line_color="black",
                         annotation_text="Overall Mean", annotation_position="top left")
fig_weekly_max.update_layout(
    template="plotly_white",
    yaxis_title="Average Max Students",
    xaxis_title="Week Number",
    bargap=0.2
)

# ---------------------------
# 3. HOURLY (Half-Hourly for a Specific Day) (MAX STUDENTS)
# ---------------------------
target_day = pd.to_datetime("2025-08-10")
df_day = df[df["date"] == target_day].copy()
df_day = df_day.sort_values("start_datetime")

fig_hour_max = px.bar(
    df_day,
    x="time_label",
    y="max_students_no",
    title=f"🕧 Half-Hourly Max Students – {target_day.date()}",
    labels={"time_label": "Start Time", "max_students_no": "Max Students"},
    color_discrete_sequence=["#7f7f7f"]
)
fig_hour_max.add_hline(y=df_day["max_students_no"].mean(), line_dash="dash", line_color="red",
                       annotation_text="Day Mean", annotation_position="top left")

fig_hour_max.update_layout(
    template="plotly_white",
    yaxis_title="Max Students (Per Session)",
    xaxis_title="Half-Hour Time Slot",
    bargap=0.2
)

# ---------------------------
# 4. DAILY AVERAGE (MIN STUDENTS)
# ---------------------------
df_daily_min = df.groupby("date", as_index=False)["min_students_no"].mean()

fig_daily_min = px.bar(
    df_daily_min,
    x="date",
    y="min_students_no",
    title="📅 Daily Average Min Students",
    labels={"date": "Date", "min_students_no": "Average Min Students"},
    color_discrete_sequence=["#1f77b4"]
)
fig_daily_min.add_hline(y=df_daily_min["min_students_no"].mean(), line_dash="dash", line_color="black",
                        annotation_text="Overall Mean", annotation_position="top left")

fig_daily_min.update_layout(
    template="plotly_white",
    yaxis_title="Average Min Students",
    xaxis_title="Date",
    bargap=0.2
)

# ---------------------------
# 5. WEEKLY AVERAGE (MIN STUDENTS)
# ---------------------------
df_weekly_min = df.groupby("week", as_index=False)["min_students_no"].mean()

fig_weekly_min = px.bar(
    df_weekly_min,
    x="week",
    y="min_students_no",
    title="📈 Weekly Average Min Students",
    labels={"week": "Week Number", "min_students_no": "Average Min Students"},
    color_discrete_sequence=["#2ca02c"]
)
fig_weekly_min.add_hline(y=df_weekly_min["min_students_no"].mean(), line_dash="dash", line_color="black",
                         annotation_text="Overall Mean", annotation_position="top left")
fig_weekly_min.update_layout(
    template="plotly_white",
    yaxis_title="Average Min Students",
    xaxis_title="Week Number",
    bargap=0.2
)

# ---------------------------
# 6. HOURLY (Half-Hourly for a Specific Day) (MIN STUDENTS)
# ---------------------------
fig_hour_min = px.bar(
    df_day,
    x="time_label",
    y="min_students_no",
    title=f"🕧 Half-Hourly Min Students – {target_day.date()}",
    labels={"time_label": "Start Time", "min_students_no": "Min Students"},
    color_discrete_sequence=["#7f7f7f"]
)
fig_hour_min.add_hline(y=df_day["min_students_no"].mean(), line_dash="dash", line_color="red",
                       annotation_text="Day Mean", annotation_position="top left")

fig_hour_min.update_layout(
    template="plotly_white",
    yaxis_title="Min Students (Per Session)",
    xaxis_title="Half-Hour Time Slot",
    bargap=0.2
)

# ---------------------------
# 7. WEEKLY AVERAGE STUDENTS
# ---------------------------
weekly_avg_students = df.groupby("week")[["avg_students_no"]].mean().reset_index()
fig_weekly_avg = px.bar(
    weekly_avg_students,
    x="week",
    y="avg_students_no",
    title="Weekly Average Students Number",
    labels={"week": "Week Number", "avg_students_no": "Average Students"}
)
fig_weekly_avg.add_hline(
    y=weekly_avg_students["avg_students_no"].mean(),
    line_dash="dash",
    line_color="red",
    annotation_text="Mean",
    annotation_position="top left"
)

# ---------------------------
# 8. DAILY AVERAGE STUDENTS
# ---------------------------
daily_avg_students = df.groupby("date")[["avg_students_no"]].mean().reset_index()
fig_daily_avg = px.bar(
    daily_avg_students,
    x="date",
    y="avg_students_no",
    title="Daily Average Students Number",
    labels={"date": "Date", "avg_students_no": "Average Students"}
)
fig_daily_avg.add_hline(
    y=daily_avg_students["avg_students_no"].mean(),
    line_dash="dash",
    line_color="red",
    annotation_text="Mean",
    annotation_position="top left"
)

# ---------------------------
# 9. HALF-HOURLY AVERAGE STUDENTS
# ---------------------------
half_hour_avg_students = filtered.groupby("time_label")[["avg_students_no"]].mean().reset_index()

fig_half_hour_avg = px.bar(
    half_hour_avg_students,
    x="time_label",
    y="avg_students_no",
    category_orders={"time_label": time_order},
    title="Half-Hourly Average Students Number",
    labels={"time_label": "Half Hours", "avg_students_no": "Average Students"}
)
fig_half_hour_avg.add_hline(
    y=half_hour_avg_students["avg_students_no"].mean(),
    line_dash="dash",
    line_color="red",
    annotation_text="Mean",
    annotation_position="top left"
)

# =============================================================================
# ATTENTION AND DISTRACTION ANALYSIS
# =============================================================================

# ---------------------------
# 1. TREND COMPARISON: ATTENDANCE, ATTENTION, DISTRACTION
# ---------------------------

# Daily trends
df_daily = df.groupby("date", as_index=False)[
    ["attendance_pct", "avg_attention_rate", "avg_distraction_rate"]
].mean()

df_daily_melted = df_daily.melt(
    id_vars=["date"],
    value_vars=["attendance_pct", "avg_attention_rate", "avg_distraction_rate"],
    var_name="variable",
    value_name="value"
)

fig_daily_trends = px.line(
    df_daily_melted,
    x="date",
    y="value",
    color="variable",
    title="📅 Daily Trends: Attendance, Attention, Distraction",
    markers=True,
    labels={"date": "Date", "value": "Percentage"},
    hover_data={"value": ":.2f"},
    color_discrete_map={
        "attendance_pct": "#636EFA",
        "avg_attention_rate": "#EF553B",
        "avg_distraction_rate": "#00CC96"
    }
)
fig_daily_trends.update_traces(line=dict(width=2))
fig_daily_trends.update_layout(template="plotly_white", hovermode="x unified")

# Weekly trends
df_weekly = df.groupby("week", as_index=False)[
    ["attendance_pct", "avg_attention_rate", "avg_distraction_rate"]
].mean()

df_weekly_melted = df_weekly.melt(
    id_vars=["week"],
    value_vars=["attendance_pct", "avg_attention_rate", "avg_distraction_rate"],
    var_name="variable",
    value_name="value"
)

fig_weekly_trends = px.line(
    df_weekly_melted,
    x="week",
    y="value",
    color="variable",
    title="📊 Weekly Trends: Attendance, Attention, Distraction",
    markers=True,
    labels={"week": "Week Number", "value": "Percentage"},
    hover_data={"value": ":.2f"},
    color_discrete_map={
        "attendance_pct": "#636EFA",
        "avg_attention_rate": "#EF553B",
        "avg_distraction_rate": "#00CC96"
    }
)
fig_weekly_trends.update_traces(line=dict(width=2))
fig_weekly_trends.update_layout(template="plotly_white", hovermode="x unified")

# Half-hour trends for a specific day
df_day = df[df["date"] == target_day].copy()

df_halfhour_melted = df_day.melt(
    id_vars=["time_label"],
    value_vars=["attendance_pct", "avg_attention_rate", "avg_distraction_rate"],
    var_name="variable",
    value_name="value"
)

fig_halfhour_trends = px.line(
    df_halfhour_melted,
    x="time_label",
    y="value",
    color="variable",
    title=f"🕧 Half-Hourly Trends on {target_day.date()}",
    markers=True,
    labels={"time_label": "Half-Hour Slot", "value": "Percentage"},
    hover_data={"value": ":.2f"},
    color_discrete_map={
        "attendance_pct": "#636EFA",
        "avg_attention_rate": "#EF553B",
        "avg_distraction_rate": "#00CC96"
    }
)
fig_halfhour_trends.update_traces(line=dict(width=2))
fig_halfhour_trends.update_layout(template="plotly_white", hovermode="x unified")

# ---------------------------
# 2. MAX ATTENTION VS DISTRACTION COMPARISON
# ---------------------------

# Weekly comparison
weekly_max = df.groupby("week")[["max_attention_rate", "max_distraction_rate"]].mean().reset_index()
weekly_max_melted = weekly_max.melt(id_vars="week", var_name="Metric", value_name="Value")

fig_week_max = px.bar(
    weekly_max_melted,
    x="week",
    y="Value",
    color="Metric",
    barmode="group",
    title="📊 Weekly Average: Max Attention vs Distraction",
    labels={"week": "Week Number", "Value": "Percentage (%)"},
    color_discrete_map={
        "max_attention_rate": "#2E86AB",
        "max_distraction_rate": "#E74C3C"
    },
    text_auto='.2s'
)
fig_week_max.update_layout(
    template="plotly_white",
    plot_bgcolor="#FAFAFA",
    xaxis=dict(showgrid=True, gridcolor='lightgrey'),
    yaxis=dict(showgrid=True, gridcolor='lightgrey'),
    legend=dict(title=""),
    title_font_size=20
)

# Daily comparison
daily_max = df.groupby("date")[["max_attention_rate", "max_distraction_rate"]].mean().reset_index()
daily_max_melted = daily_max.melt(id_vars="date", var_name="Metric", value_name="Value")

fig_day_max = px.bar(
    daily_max_melted,
    x="date",
    y="Value",
    color="Metric",
    barmode="group",
    title="📅 Daily Average: Max Attention vs Distraction",
    labels={"date": "Date", "Value": "Percentage (%)"},
    color_discrete_map={
        "max_attention_rate": "#2E86AB",
        "max_distraction_rate": "#E74C3C"
    },
    text_auto='.2s'
)
fig_day_max.update_layout(
    template="plotly_white",
    plot_bgcolor="#FAFAFA",
    xaxis=dict(showgrid=True, gridcolor='lightgrey'),
    yaxis=dict(showgrid=True, gridcolor='lightgrey'),
    legend=dict(title=""),
    title_font_size=20
)

# Half-hourly comparison
half_hourly_max = df_day[["time_label", "max_attention_rate", "max_distraction_rate"]]
half_hourly_max_melted = half_hourly_max.melt(id_vars="time_label", var_name="Metric", value_name="Value")

fig_half_hour_max = px.bar(
    half_hourly_max_melted,
    x="time_label",
    y="Value",
    color="Metric",
    barmode="group",
    title=f"🕧 Half-Hourly Max Attention vs Distraction on {target_day.date()}",
    labels={"time_label": "Time Slot", "Value": "Percentage (%)"},
    color_discrete_map={
        "max_attention_rate": "#2E86AB",
        "max_distraction_rate": "#E74C3C"
    },
    text_auto='.2s'
)
fig_half_hour_max.update_layout(
    template="plotly_white",
    plot_bgcolor="#FAFAFA",
    xaxis=dict(showgrid=True, gridcolor='lightgrey'),
    yaxis=dict(showgrid=True, gridcolor='lightgrey'),
    legend=dict(title=""),
    title_font_size=20
)

# ---------------------------
# 3. MIN ATTENTION VS DISTRACTION COMPARISON
# ---------------------------

# Weekly comparison
weekly_min = df.groupby("week")[["min_attention_rate", "min_distraction_rate"]].mean().reset_index()
weekly_min_melted = weekly_min.melt(id_vars="week", var_name="Metric", value_name="Value")

fig_week_min = px.bar(
    weekly_min_melted,
    x="week",
    y="Value",
    color="Metric",
    barmode="group",
    title="📊 Weekly Average: Min Attention vs Distraction",
    labels={"week": "Week Number", "Value": "Percentage (%)"},
    color_discrete_map={
        "min_attention_rate": "#2E86AB",
        "min_distraction_rate": "#E74C3C"
    },
    text_auto='.2s'
)
fig_week_min.update_layout(
    template="plotly_white",
    plot_bgcolor="#FAFAFA",
    xaxis=dict(showgrid=True, gridcolor='lightgrey'),
    yaxis=dict(showgrid=True, gridcolor='lightgrey'),
    legend=dict(title=""),
    title_font_size=20
)

# Daily comparison
daily_min = df.groupby("date")[["min_attention_rate", "min_distraction_rate"]].mean().reset_index()
daily_min_melted = daily_min.melt(id_vars="date", var_name="Metric", value_name="Value")

fig_day_min = px.bar(
    daily_min_melted,
    x="date",
    y="Value",
    color="Metric",
    barmode="group",
    title="📅 Daily Average: Min Attention vs Distraction",
    labels={"date": "Date", "Value": "Percentage (%)"},
    color_discrete_map={
        "min_attention_rate": "#2E86AB",
        "min_distraction_rate": "#E74C3C"
    },
    text_auto='.2s'
)
fig_day_min.update_layout(
    template="plotly_white",
    plot_bgcolor="#FAFAFA",
    xaxis=dict(showgrid=True, gridcolor='lightgrey'),
    yaxis=dict(showgrid=True, gridcolor='lightgrey'),
    legend=dict(title=""),
    title_font_size=20
)

# Half-hourly comparison
half_hourly_min = df_day[["time_label", "min_attention_rate", "min_distraction_rate"]]
half_hourly_min_melted = half_hourly_min.melt(id_vars="time_label", var_name="Metric", value_name="Value")

fig_half_hour_min = px.bar(
    half_hourly_min_melted,
    x="time_label",
    y="Value",
    color="Metric",
    barmode="group",
    title=f"🕧 Half-Hourly Min Attention vs Distraction on {target_day.date()}",
    labels={"time_label": "Time Slot", "Value": "Percentage (%)"},
    color_discrete_map={
        "min_attention_rate": "#2E86AB",
        "min_distraction_rate": "#E74C3C"
    },
    text_auto='.2s'
)
fig_half_hour_min.update_layout(
    template="plotly_white",
    plot_bgcolor="#FAFAFA",
    xaxis=dict(showgrid=True, gridcolor='lightgrey'),
    yaxis=dict(showgrid=True, gridcolor='lightgrey'),
    legend=dict(title=""),
    title_font_size=20
)

# ---------------------------
# 4. AVERAGE ATTENTION RATE TRENDS WITH DISTRACTION RATE
# ---------------------------

# Weekly average attention and distraction
weekly_metrics = df.groupby(df['date'].dt.isocalendar().week)[['avg_attention_rate', 'avg_distraction_rate']].mean().reset_index()
weekly_metrics.rename(columns={'week': 'week_number'}, inplace=True)

# Melt the data for plotting
weekly_melted = weekly_metrics.melt(id_vars='week_number',
                                   value_vars=['avg_attention_rate', 'avg_distraction_rate'],
                                   var_name='metric',
                                   value_name='rate')

fig_week_attention = px.line(weekly_melted, x='week_number', y='rate', color='metric',
                             title='Weekly Average Attention vs Distraction Rate',
                             labels={'week_number': 'Week Number', 'rate': 'Rate (%)'},
                             color_discrete_map={
                                 'avg_attention_rate': '#2E86AB',
                                 'avg_distraction_rate': '#E74C3C'
                             })

# Daily average attention and distraction
daily_metrics = df.groupby('date')[['avg_attention_rate', 'avg_distraction_rate']].mean().reset_index()
daily_melted = daily_metrics.melt(id_vars='date',
                                 value_vars=['avg_attention_rate', 'avg_distraction_rate'],
                                 var_name='metric',
                                 value_name='rate')

fig_day_attention = px.line(daily_melted, x='date', y='rate', color='metric',
                            title='Daily Average Attention vs Distraction Rate',
                            labels={'date': 'Date', 'rate': 'Rate (%)'},
                            color_discrete_map={
                                'avg_attention_rate': '#2E86AB',
                                'avg_distraction_rate': '#E74C3C'
                            })

# Half-hour average attention and distraction - FIXED VERSION
half_hour_metrics = df.groupby('time_label')[['avg_attention_rate', 'avg_distraction_rate']].mean().reset_index()

# Ensure proper ordering of time labels
time_order = ["10:00", "10:30", "11:00", "11:30", "12:00", "13:00", "13:30", "14:00", "14:30", "15:00"]
half_hour_metrics['time_label'] = pd.Categorical(half_hour_metrics['time_label'], categories=time_order, ordered=True)
half_hour_metrics = half_hour_metrics.sort_values('time_label')

# Melt the data for plotting
half_hour_melted = half_hour_metrics.melt(id_vars='time_label',
                                         value_vars=['avg_attention_rate', 'avg_distraction_rate'],
                                         var_name='metric',
                                         value_name='rate')

fig_half_hour_attention = px.line(half_hour_melted, x='time_label', y='rate', color='metric',
                                  title='Average Attention vs Distraction Rate by Half-Hour',
                                  labels={'time_label': 'Time', 'rate': 'Rate (%)'},
                                  color_discrete_map={
                                      'avg_attention_rate': '#2E86AB',
                                      'avg_distraction_rate': '#E74C3C'
                                  },
                                  markers=True)

fig_half_hour_attention.update_layout(
    xaxis=dict(
        type='category',
        tickmode='array',
        tickvals=time_order,
        ticktext=[t.replace(":00", "") for t in time_order]
    ),
    yaxis=dict(range=[0, 90]),  # Adjusted range to accommodate both metrics
    legend=dict(
        title='Metric',
        yanchor="top",
        y=0.99,
        xanchor="left",
        x=0.01
    )
)

# Update legend labels
fig_half_hour_attention.for_each_trace(lambda t: t.update(name='Attention Rate' if 'attention' in t.name else 'Distraction Rate'))

# Show the plot
fig_half_hour_attention.show()

# =============================================================================
# DASHBOARD SUMMARY AND KEY INSIGHTS
# =============================================================================

# Create a summary statistics table
summary_stats = pd.DataFrame({
    'Metric': [
        'Average Attendance %',
        'Average Attention Rate %',
        'Average Distraction Rate %',
        'Max Students (Avg)',
        'Min Students (Avg)',
        'Avg Students per Session'
    ],
    'Value': [
        df['attendance_pct'].mean(),
        df['avg_attention_rate'].mean(),
        df['avg_distraction_rate'].mean(),
        df['max_students_no'].mean(),
        df['min_students_no'].mean(),
        df['avg_students_no'].mean()
    ]
})

# Format the values
summary_stats['Value'] = summary_stats['Value'].round(2)

# Create a table figure
fig_summary = go.Figure(data=[go.Table(
    header=dict(
        values=['<b>Metric</b>', '<b>Value</b>'],
        fill_color='#2E86AB',
        align='center',
        font=dict(color='white', size=14)
    ),
    cells=dict(
        values=[summary_stats.Metric, summary_stats.Value],
        fill_color='#F8F9FA',
        align='center',
        font=dict(size=13)
    ))
])

fig_summary.update_layout(
    title='📊 Key Performance Indicators (Overall)',
    title_font=dict(size=20)
)

# =============================================================================
# DISPLAY ALL VISUALIZATIONS
# =============================================================================

print("=" * 80)
print("ATTENDANCE AND ENGAGEMENT ANALYSIS DASHBOARD")
print("=" * 80)

# Show summary table
fig_summary.show()

# Show attendance visualizations
fig_hourly.show()
fig_daily.show()
fig_weekly.show()

# Show student count visualizations
fig_daily_max.show()
fig_weekly_max.show()
fig_hour_max.show()
fig_daily_min.show()
fig_weekly_min.show()
fig_hour_min.show()
fig_weekly_avg.show()
fig_daily_avg.show()
fig_half_hour_avg.show()

# Show attention and distraction visualizations
fig_daily_trends.show()
fig_weekly_trends.show()
fig_halfhour_trends.show()
fig_week_max.show()
fig_day_max.show()
fig_half_hour_max.show()
fig_week_min.show()
fig_day_min.show()
fig_half_hour_min.show()
fig_week_attention.show()
fig_day_attention.show()
fig_half_hour_attention.show()

# =============================================================================
# KEY INSIGHTS AND RECOMMENDATIONS
# =============================================================================

print("\n" + "=" * 80)
print("KEY INSIGHTS AND RECOMMENDATIONS")
print("=" * 80)

# Calculate correlation between attendance and attention
correlation = df['attendance_pct'].corr(df['avg_attention_rate'])
print(f"📈 Correlation between attendance and attention: {correlation:.3f}")

# Find best and worst performing days
best_day = df_daily.loc[df_daily['attendance_pct'].idxmax()]
worst_day = df_daily.loc[df_daily['attendance_pct'].idxmin()]

print(f"✅ Best day: {best_day['date'].date()} (Attendance: {best_day['attendance_pct']:.1f}%)")
print(f"❌ Worst day: {worst_day['date'].date()} (Attendance: {worst_day['attendance_pct']:.1f}%)")

# Find time slots with highest and lowest attention
best_time_slot = df_day.loc[df_day['avg_attention_rate'].idxmax()]
worst_time_slot = df_day.loc[df_day['avg_attention_rate'].idxmin()]

print(f"🕒 Best time slot: {best_time_slot['time_label']} (Attention: {best_time_slot['avg_attention_rate']:.1f}%)")
print(f"🕒 Worst time slot: {worst_time_slot['time_label']} (Attention: {worst_time_slot['avg_attention_rate']:.1f}%)")

# Recommendations based on analysis
print("\n" + "=" * 80)
print("RECOMMENDATIONS")
print("=" * 80)
print("1. Focus on improving attendance on identified low-performing days")
print("2. Investigate reasons for low attention during specific time slots")
print("3. Consider scheduling important content during high-attention periods")
print("4. Monitor the relationship between attendance and attention rates")
print("5. Implement interventions for time slots with high distraction rates")
