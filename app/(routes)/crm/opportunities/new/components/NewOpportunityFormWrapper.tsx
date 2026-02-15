"use client";

import { useRouter } from "next/navigation";
import { NewOpportunityForm, NewOpportunityFormProps } from "../../components/NewOpportunityForm";

export function NewOpportunityFormWrapper(props: Omit<NewOpportunityFormProps, 'onDialogClose'>) {
    const router = useRouter();

    return (
        <NewOpportunityForm
            {...props}
            onDialogClose={() => router.push("/crm/opportunities")}
        />
    );
}
