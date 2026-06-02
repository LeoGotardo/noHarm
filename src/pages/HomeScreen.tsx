import AppLayout from "@/components/AppLayout";
import StreakCounter from "@/components/StreakCounter";
import QuoteCard from "@/components/QuoteCard";
import { Shield, TrendingUp } from "lucide-react";
import { useCurrentStreak, useStartStreak, useEndStreak } from "@/hooks/api/useStreak";
import { useTranslation } from "react-i18next";

const HomeScreen = () => {
  const { t } = useTranslation();
  const { data: streak, isLoading, isError } = useCurrentStreak();
  const endStreak = useEndStreak();
  const startStreak = useStartStreak();

  const startDate = streak?.start ?? new Date().toISOString();
  const totalDays = streak?.start
    ? Math.floor((Date.now() - new Date(streak.start).getTime()) / 86400000)
    : 0;

  if (isLoading) {
    return (
      <AppLayout title="NoHarm">
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          {t("home.loading")}
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout title="NoHarm">
        <div className="flex flex-col items-center gap-6 pt-8">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/20 border border-border/30">
            <Shield size={12} className="text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground">{t("home.notStarted")}</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">{t("home.noActiveStreak")}</p>
          <button
            onClick={() => startStreak.mutate()}
            disabled={startStreak.isPending}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold disabled:opacity-50"
          >
            {startStreak.isPending ? t("home.starting") : t("home.startJourney")}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="NoHarm">
      <div className="flex flex-col items-center gap-6 pt-2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/8 border border-success/15">
          <Shield size={12} className="text-success" />
          <span className="text-[11px] font-semibold text-success">{t("home.protected")}</span>
        </div>

        <StreakCounter
          startDate={startDate}
          onReset={() => endStreak.mutate()}
        />

        <div className="w-full grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-primary/60" />
              <span className="text-lg font-bold text-foreground">{Math.floor(totalDays / 7)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("home.weeks")}</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Shield size={14} className="text-primary/60" />
              <span className="text-lg font-bold text-foreground">{Math.floor(totalDays / 30)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("home.months")}</p>
          </div>
        </div>

        <div className="w-full">
          <QuoteCard />
        </div>
      </div>
    </AppLayout>
  );
};

export default HomeScreen;
