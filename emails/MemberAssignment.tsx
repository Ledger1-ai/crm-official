import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from "@react-email/components";
import * as React from "react";

interface MemberAssignmentEmailProps {
    memberName: string;
    assignedByName: string;
    assignmentType: "project" | "pool";
    assignmentName: string;
    role?: string;
    projectDescription?: string;
    appUrl: string;
    dashboardUrl: string;
}

export const MemberAssignmentEmail = ({
    memberName,
    assignedByName,
    assignmentType,
    assignmentName,
    role = "Member",
    projectDescription,
    appUrl,
    dashboardUrl,
}: MemberAssignmentEmailProps) => {
    const typeLabel = assignmentType === "project" ? "Project" : "Lead Pool";
    const previewText = `You've been assigned to ${assignmentName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded-lg my-[40px] mx-auto p-[20px] w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={`${appUrl}/BasaltCRMWide.png`}
                                width="150"
                                height="42"
                                alt="BasaltCRM"
                                className="my-0 mx-auto"
                            />
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            🎯 New {typeLabel} Assignment
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {memberName},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>{assignedByName}</strong> has assigned you to the following {typeLabel.toLowerCase()}:
                        </Text>

                        {/* Assignment Card */}
                        <Section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 my-4 border border-indigo-100">
                            <Text className="text-xl font-bold text-indigo-900 m-0 mb-2">
                                {assignmentName}
                            </Text>
                            {projectDescription && (
                                <Text className="text-sm text-gray-600 m-0 mb-2">
                                    {projectDescription}
                                </Text>
                            )}
                            <Text className="text-xs text-indigo-600 font-semibold m-0">
                                Your Role: {role}
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            {assignmentType === "project"
                                ? "You now have access to view this project and collaborate with your team. Check your dashboard for details."
                                : "You can now run campaigns on the leads in this pool. Head to your dashboard to get started."}
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md text-white py-3 px-6 text-[14px] font-semibold no-underline text-center shadow-md"
                                href={dashboardUrl}
                            >
                                View My Assignments
                            </Button>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            or copy and paste this URL into your browser:{" "}
                            <Link
                                href={dashboardUrl}
                                className="text-indigo-600 no-underline"
                            >
                                {dashboardUrl}
                            </Link>
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            This notification was sent because you were assigned to a {typeLabel.toLowerCase()} in{" "}
                            <span className="text-black">{process.env.NEXT_PUBLIC_APP_NAME || "BasaltCRM"}</span>.
                            If you believe this was a mistake, please contact your administrator.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default MemberAssignmentEmail;
