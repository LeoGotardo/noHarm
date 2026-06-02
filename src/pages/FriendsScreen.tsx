import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import FriendCard from "@/components/FriendCard";
import { UserPlus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFriendships, useSendFriendRequest } from "@/hooks/api/useFriends";
import { useMe } from "@/hooks/api/useUser";

const FriendsScreen = () => {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: friendshipsData } = useFriendships();
  const sendRequest = useSendFriendRequest();
  const [addInput, setAddInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const friendships = friendshipsData?.friendships ?? [];

  const myId = me?.id?.toString() ?? "";

  const friends = friendships.map((f) => {
    const friendId = String(f.sender) === myId ? String(f.reciver) : String(f.sender);
    const initials = friendId.slice(0, 2).toUpperCase();
    return { id: friendId, initials, friendshipId: String(f.id) };
  });

  const { t } = useTranslation();

  const handleAdd = () => {
    if (!addInput.trim()) return;
    sendRequest.mutate(addInput.trim(), {
      onSuccess: () => { setAddInput(""); setShowAdd(false); },
    });
  };

  return (
    <AppLayout title={t("nav.friends")}>
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-foreground/70 text-[11px] font-semibold">
            <Users size={13} />
            {t("friends.friendsCount", { count: friends.length })}
          </div>
        </div>

        {showAdd ? (
          <div className="flex gap-2">
            <input
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={t("friends.placeholder")}
              className="flex-1 bg-card text-foreground placeholder:text-muted-foreground/50 rounded-2xl px-4 py-2.5 text-sm outline-none border border-border/30 focus:border-primary/30 transition-all"
            />
            <button
              onClick={handleAdd}
              disabled={sendRequest.isPending}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold disabled:opacity-50"
            >
              {sendRequest.isPending ? "…" : t("friends.send")}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-2.5 rounded-2xl border border-border/30 text-sm text-muted-foreground"
            >
              {t("friends.cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/20 text-primary/70 text-sm font-medium hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-200"
          >
            <UserPlus size={16} />
            {t("friends.addFriend")}
          </button>
        )}

        <div className="space-y-2">
          {friends.map((f) => (
            <FriendCard
              key={f.id}
              name={f.id}
              avatar={f.initials}
              online={false}
              streak={0}
              onChat={() => navigate(`/chat?friend=${f.id}`)}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default FriendsScreen;
