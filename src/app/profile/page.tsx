import { ProfileModule } from "@/modules/checkout/profile-module";
import { requireAuth } from '@/src/lib/auth-guard';

export default async function ProfilePage() {
  await requireAuth('/profile');

  return (
    <>
      <ProfileModule />
    </>
  );
}
