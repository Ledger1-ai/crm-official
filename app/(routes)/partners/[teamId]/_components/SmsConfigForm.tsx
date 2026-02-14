"use client";

import React from "react";
import SmsConfigForm from "@/components/sms/SmsConfigForm";

interface SmsConfigFormProps {
    teamId: string;
    teamName: string;
}

export default function PartnerSmsConfigForm({ teamId, teamName }: SmsConfigFormProps) {
    // We simply wrap the shared component here.
    // This maintains the file structure but uses the shared logic.
    return <SmsConfigForm teamId={teamId} teamName={teamName} />;
}
