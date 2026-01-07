import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import React from "react";

interface ContainerProps {
    title?: string;
    description?: string;
    visibility?: string;
    children: React.ReactNode;
}

const Container = ({
    title,
    description,
    visibility,
    children,
    sticky = false,
}: ContainerProps & { sticky?: boolean }) => {
    if (sticky) {
        return (
            <div className="h-[calc(100vh-80px)] md:h-full flex flex-col bg-background">
                <div className="sticky top-0 z-10 bg-background p-4 md:px-6 lg:px-8 pb-2 shrink-0">
                    {(title || description) && (
                        <div>
                            <Heading
                                title={title || ""}
                                description={description || ""}
                                visibility={visibility}
                            />
                            <Separator className="mt-4" />
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 pb-20 md:pb-4">
                    <div className="text-sm space-y-5">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 md:p-6 lg:p-8 pt-6 md:border-l min-w-0 pb-48 md:pb-12">
            {(title || description) && (
                <div className="shrink-0">
                    <Heading
                        title={title || ""}
                        description={description || ""}
                        visibility={visibility}
                    />
                    <Separator className="mt-4" />
                </div>
            )}
            <div className="text-sm space-y-5">
                {children}
            </div>
        </div>
    );
};

export default Container;
