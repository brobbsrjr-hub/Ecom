import { BusinessForm } from '@/components/BusinessForm';
import { createBusiness } from '../actions';

export default async function NewBusiness({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Add client</h1>
      <BusinessForm action={createBusiness} isAdmin error={error} />
    </>
  );
}
