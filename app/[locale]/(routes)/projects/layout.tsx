import ProjectsSidebar from "./components/ProjectsSidebar";

export default function ProjectsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* ProjectsSidebar - Desktop only, Fixed height */}
            <ProjectsSidebar />
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                {children}
            </div>
        </div>
    );
}
