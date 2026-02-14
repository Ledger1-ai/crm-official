"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarDays,
  CoinsIcon,
  File,
  Globe2,
  Landmark,
  Medal,
  Phone,
  User,
  Linkedin,
  Facebook,
  Twitter,
  Mail,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { EnvelopeClosedIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { LeadActions } from "./LeadActions";
import { SmartEmailModal } from "@/components/modals/SmartEmailModal";
import { useState, useEffect } from "react";
import axios from "axios";

interface OppsViewProps {
  data: any;
}

export function BasicView({ data }: OppsViewProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/team/members");
        setUsers(response.data.members || []);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };
    fetchUsers();
  }, []);

  if (!data) return <div>Lead not found</div>;

  return (
    <div className="pb-3 space-y-5">
      <SmartEmailModal
        open={emailOpen}
        onOpenChange={setEmailOpen}
        recipientEmail={data.email || ""}
        recipientName={`${data.firstName} ${data.lastName}`}
        leadId={data.id}
      />
      <Card className="bg-[#0a0a0a] border-white/10 overflow-hidden shadow-xl">
        <CardHeader className="pb-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex w-full justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <User size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white tracking-tight">
                  {data.firstName} {data.lastName}
                </CardTitle>
                <CardDescription className="text-white/40 text-xs font-mono">ID: {data.id}</CardDescription>
              </div>
            </div>
            <LeadActions data={data} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <div className="mt-1 h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                  <Landmark size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Company</p>
                  <p className="text-sm font-medium text-white/90">{data.company || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <div className="mt-1 h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <Medal size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Job Title</p>
                  <p className="text-sm font-medium text-white/90">{data.jobTitle || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => data.email && setEmailOpen(true)}>
                <div className="mt-1 h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Mail size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Email Address</p>
                  <p className="text-sm font-medium text-white/90 group-hover:text-blue-400 transition-colors">{data.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <div className="mt-1 h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                  <Phone size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Phone Number</p>
                  <p className="text-sm font-medium text-white/90">{data.phone || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <div className="mt-1 h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                  <Globe2 size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Website</p>
                  <div className="text-sm font-medium text-white/90">
                    {data.lead_source ? (
                      <Link href={data.lead_source} target="_blank" className="hover:underline text-blue-500 flex items-center gap-1">
                        {data.lead_source}
                      </Link>
                    ) : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <div className="mt-1 h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                  <User size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Assigned To</p>
                  <p className="text-sm font-medium text-white/90">
                    {users.find((user) => user.id === data.assigned_to)?.name || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <div className="mt-1 h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                  <CalendarDays size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Lifecycle Dates</p>
                  <div className="flex gap-8">
                    <div>
                      <span className="text-[9px] text-white/30 block">CREATED</span>
                      <span className="text-xs text-white/70">{data.created_on ? moment(data.created_on).format("MMM DD, YYYY") : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/30 block">LAST UPDATE</span>
                      <span className="text-xs text-white/70">{data.updatedAt ? moment(data.updatedAt).format("MMM DD, YYYY") : "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <div className="mt-1 h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <LightningBoltIcon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Pipeline Status</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    <p className="text-sm font-medium text-white/90">{data.status || "NEW"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <div className="mt-1 h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400">
                  <CoinsIcon size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Lead Source</p>
                  <p className="text-sm font-medium text-white/90">{data.type || "N/A"}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 ml-2">Social Profiles</p>
                <div className="flex gap-3 ml-2">
                  {data.social_linkedin && (
                    <Link href={data.social_linkedin} target="_blank" className="h-9 w-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center hover:bg-[#0077b5] hover:border-[#0077b5] hover:text-white transition-all">
                      <Linkedin size={18} />
                    </Link>
                  )}
                  {data.social_facebook && (
                    <Link href={data.social_facebook} target="_blank" className="h-9 w-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center hover:bg-[#1877f2] hover:border-[#1877f2] hover:text-white transition-all">
                      <Facebook size={18} />
                    </Link>
                  )}
                  {data.social_twitter && (
                    <Link href={data.social_twitter} target="_blank" className="h-9 w-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center hover:bg-black hover:border-white/20 hover:text-white transition-all">
                      <Twitter size={18} />
                    </Link>
                  )}
                  {!data.social_linkedin && !data.social_facebook && !data.social_twitter && (
                    <p className="text-xs text-white/20 italic">No social profiles connected</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-white/40">
                <File size={16} />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Background & Internal Notes</p>
                <p className="text-sm text-white/60 leading-relaxed italic">
                  {data.description || "No internal notes provided for this lead."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
