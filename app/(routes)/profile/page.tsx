import { getUser } from "@/actions/get-user";

import Container from "../components/ui/Container";
import { ProfileTabs } from "./components/ProfileTabs";

const ProfilePage = async () => {
  const data = await getUser();

  if (!data) {
    return <div>No user data.</div>;
  }

  return (
    <Container
      title="Profile"
      description={"Here you can edit your user profile"}
    >
      <ProfileTabs data={data} />
    </Container>
  );
};

export default ProfilePage;
