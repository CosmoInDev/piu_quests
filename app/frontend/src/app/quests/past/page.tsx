export default function PastQuestsPage() {
  // TODO: fetch past quests from API
  const pastQuests: unknown[] = [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">지난번 숙제</h1>
      {pastQuests.length === 0 ? (
        <p className="text-muted-foreground">지난 숙제 기록이 없습니다.</p>
      ) : (
        <div>{/* TODO: quest list */}</div>
      )}
    </div>
  );
}
