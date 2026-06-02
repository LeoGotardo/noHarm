import { useAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { loginWithGoogle, loading } = useAuth();
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background px-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black gradient-text">NoHarm</h1>
        <p className="text-sm text-muted-foreground">{t("login.tagline")}</p>
      </div>
      <Button onClick={loginWithGoogle} disabled={loading} className="rounded-2xl px-10 h-11">
        {loading ? t("login.signingIn") : t("login.signInGoogle")}
      </Button>
    </div>
  );
}
