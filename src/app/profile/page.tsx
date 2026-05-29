import { ProfileModule } from "@/modules/checkout/profile-module";
import Navbar from "@/src/components/ui/navbar";

export default function ProfilePage() {
  return (
    <>
      <Navbar variant="light" />
      <ProfileModule />
    </>
  );
}
