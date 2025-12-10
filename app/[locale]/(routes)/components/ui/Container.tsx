import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import React from "react";

interface ContainerProps {
    title: string;
    description: string;
    visibility?: string;
    children: React.ReactNode;
}

const Container = ({
    title,
    description,
    visibility,
    children,
}: ContainerProps) => {
    return (
        <div className="space-y-4 p-4 md:p-6 lg:p-8 pt-6 md:border-l min-w-0 pb-48 md:pb-12">
            <div className="shrink-0">
                <Heading
                    title={title}
                    description={description}
                    visibility={visibility}
                />
                <Separator className="mt-4" />
            </div>
            <div className="text-sm space-y-5">
                {children}
            </div>
        </div>
    );
};

export default Container;
