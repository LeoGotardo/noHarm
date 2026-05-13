import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { BarChart, Bar, XAxis, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { Trophy, Flame, Target, Calendar, TrendingUp } from "lucide-react";
import { useCurrentStreak, useRecordStreak, useStreakHistory } from "@/hooks/api/useStreak";

type StreakShape = { start?: string | null; end?: string | null };

function daysClean(streak?: StreakShape): number {
  if (!streak?.start) return 0;
  const end = streak.end ? new Date(streak.end) : new Date();
  return Math.max(0, Math.floor((end.getTime() - new Date(streak.start).getTime()) / 86400000));
}

function wasCleanOnDay(streaks: StreakShape[], date: Date): boolean {
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  return streaks.some(s => {
    if (!s.start) return false;
    const start = new Date(s.start);
    const end = s.end ? new Date(s.end) : new Date();
    return start <= dayEnd && end >= dayStart;
  });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const milestoneConfig = [
  { icon: Flame, label: "1 Week", days: 7 },
  { icon: Target, label: "1 Month", days: 30 },
  { icon: Trophy, label: "3 Months", days: 90 },
  { icon: Calendar, label: "1 Year", days: 365 },
];

const ProgressScreen = () => {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  const { data: current } = useCurrentStreak();
  const { data: record } = useRecordStreak();
  const { data: historyData } = useStreakHistory();

  const currentDays = daysClean(current);
  const recordDays = daysClean(record);
  const allStreaks: StreakShape[] = historyData?.streaks ?? (current ? [current] : []);

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { day: DAY_LABELS[d.getDay()], value: wasCleanOnDay(allStreaks, d) ? 1 : 0 };
  });

  const monthlyData = Array.from({ length: 4 }, (_, weekIdx) => {
    let cleanDays = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(date.getDate() - (3 - weekIdx) * 7 - (6 - d));
      if (wasCleanOnDay(allStreaks, date)) cleanDays++;
    }
    return { week: `W${weekIdx + 1}`, streak: cleanDays };
  });

  return (
    <AppLayout title="Progress">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-3xl font-black gradient-text">{currentDays}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase tracking-wider">Current Streak</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <TrendingUp size={14} className="text-success" />
              <p className="text-3xl font-black text-success">{recordDays}</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase tracking-wider">Best Streak</p>
          </div>
        </div>

        <div className="flex bg-card rounded-2xl p-1 border border-border/40">
          {(["weekly", "monthly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                view === v
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-5 h-48">
          <ResponsiveContainer width="100%" height="100%">
            {view === "weekly" ? (
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fill: "hsl(220 10% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" fill="hsl(262 83% 58%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={monthlyData}>
                <XAxis dataKey="week" tick={{ fill: "hsl(220 10% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(220 18% 9%)", border: "1px solid hsl(220 15% 14%)", borderRadius: 12, color: "hsl(220 15% 95%)", fontSize: 11 }} />
                <Line type="monotone" dataKey="streak" stroke="hsl(262 83% 58%)" strokeWidth={2} dot={{ fill: "hsl(262 83% 58%)", r: 3.5 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="section-title mb-3">Achievements</h3>
          <div className="grid grid-cols-4 gap-2">
            {milestoneConfig.map((m) => {
              const achieved = currentDays >= m.days;
              return (
                <div
                  key={m.label}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    achieved ? "border-primary/15 glass-card" : "border-border/30 bg-card/30 opacity-35"
                  }`}
                >
                  <m.icon size={20} className={achieved ? "text-primary" : "text-muted-foreground"} />
                  <span className="text-[9px] text-center font-medium text-muted-foreground leading-tight">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProgressScreen;
