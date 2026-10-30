import { redirect } from 'next/navigation';

export default async function BusinessIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/b/${id}/inbox`);
}
