import { ChangePasswordForm } from "@/features/profile/components/change-password-form";
import { ProfileDetails } from "@/features/profile/components/profile-details";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 p-6">
      <h2 className="font-heading text-2xl font-semibold w-fit mx-auto bg-linear-to-r from-primary to-muted-foreground text-transparent bg-clip-text">
        Profile
      </h2>
      <div className="flex flex-col justify-center h-[85dvh]">
        <div className="border p-4 rounded-lg flex flex-col gap-6">
          <ProfileDetails />
          <Separator />
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
