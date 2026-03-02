export default function OngoingQuestPage() {
  // TODO: fetch ongoing quest from API
  const ongoingQuest = null;

  if (!ongoingQuest) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-lg">
          현재 진행 중인 숙제가 없습니다. 숙제를 등록해주세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">오늘의 숙제</h1>
      {/* TODO: quest detail */}
    </div>
  );
}
