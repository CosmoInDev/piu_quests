interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuestPage({ params }: Props) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-4">퀘스트 {id}</h1>
      <p className="text-muted-foreground">퀘스트 상세 정보를 준비 중입니다...</p>
    </div>
  );
}
