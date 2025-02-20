import ProfileHeader from "@/components/Profile/ProfileHeader";
import ProfileSection from "@/components/Profile/ProfileSection";


const Profiles = () => {
  return (
    <main className="w-full h-full flex-col flex justify-start items-center mt-[80px]">
      <ProfileHeader />
      <ProfileSection />
    </main>
  );
};

export default Profiles;