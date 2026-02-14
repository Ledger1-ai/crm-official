import { notFound } from "next/navigation";
import { getDealRoomBySlug } from "@/actions/crm/deal-room";
import DealRoomView from "./components/DealRoomView";

interface Props {
    params: Promise<{
        uuid: string;
    }>;
}

export default async function DealRoomPage(props: Props) {
    const params = await props.params;
    const { uuid } = params;

    const dealRoom = await getDealRoomBySlug(uuid);

    if (!dealRoom || !dealRoom.is_active) {
        return notFound();
    }

    // Check validity date?
    if (dealRoom.valid_until && new Date() > new Date(dealRoom.valid_until)) {
        // Could show an "Expired" view instead of 404
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Proposal Expired</h1>
                    <p className="text-slate-500">This secure room is no longer accessible. Please contact your representative.</p>
                </div>
            </div>
        )
    }

    return (
        <DealRoomView
            dealRoom={dealRoom}
            contract={dealRoom.contract}
        />
    );
}
