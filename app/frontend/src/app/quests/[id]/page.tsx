interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuestPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-4">Quest {id}</h1>
      <p className="text-muted-foreground">Quest details coming soon...</p>
    </main>
  );
}
