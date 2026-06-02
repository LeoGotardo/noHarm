import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface StreakCounterProps {
  startDate: string;
  onReset: () => void;
}

interface TimeBreakdown {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeBreakdown(start: string): TimeBreakdown {
  const now = new Date();
  const startD = new Date(start);

  let years = now.getFullYear() - startD.getFullYear();
  let months = now.getMonth() - startD.getMonth();
  let days = now.getDate() - startD.getDate();
  let hours = now.getHours() - startD.getHours();
  let minutes = now.getMinutes() - startD.getMinutes();
  let seconds = now.getSeconds() - startD.getSeconds();

  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) { months += 12; years--; }

  return { years, months, days, hours, minutes, seconds };
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-14 h-14 rounded-2xl surface-elevated flex items-center justify-center">
      <span className="text-xl font-bold text-foreground tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
  </div>
);

const Separator = () => (
  <div className="flex flex-col gap-1.5 pb-4">
    <div className="w-1 h-1 rounded-full bg-primary/40" />
    <div className="w-1 h-1 rounded-full bg-primary/20" />
  </div>
);

const StreakCounter = ({ startDate, onReset }: StreakCounterProps) => {
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [time, setTime] = useState(() => getTimeBreakdown(startDate));

  useEffect(() => {
    setTime(getTimeBreakdown(startDate));
    const interval = setInterval(() => setTime(getTimeBreakdown(startDate)), 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  const totalDays = Math.floor(
    (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Big number */}
      <div className="text-center space-y-1">
        <span className="text-6xl font-black gradient-text tracking-tight">{totalDays}</span>
        <p className="text-[10px] font-bold text-muted-foreground tracking-[0.25em] uppercase">{t("streak.daysClean")}</p>
      </div>

      {/* Timer grid */}
      <div className="glass-card rounded-3xl px-5 py-5 w-full">
        <div className="flex items-center justify-center gap-2">
          {time.years > 0 && (
            <>
              <TimeUnit value={time.years} label={t("streak.years")} />
              <Separator />
            </>
          )}
          {(time.years > 0 || time.months > 0) && (
            <>
              <TimeUnit value={time.months} label={t("streak.months")} />
              <Separator />
            </>
          )}
          <TimeUnit value={time.days} label={t("streak.days")} />
          <Separator />
          <TimeUnit value={time.hours} label={t("streak.hrs")} />
          <Separator />
          <TimeUnit value={time.minutes} label={t("streak.min")} />
          <Separator />
          <TimeUnit value={time.seconds} label={t("streak.sec")} />
        </div>
      </div>

      {/* Reset */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-muted-foreground/40 hover:text-destructive transition-colors text-[11px] font-medium"
        >
          {t("streak.reset")}
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => { onReset(); setShowConfirm(false); }}
            className="px-5 py-2 bg-destructive text-destructive-foreground rounded-xl text-xs font-semibold"
          >
            {t("streak.confirm")}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-5 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-semibold"
          >
            {t("streak.cancel")}
          </button>
        </div>
      )}
    </div>
  );
};

export default StreakCounter;
