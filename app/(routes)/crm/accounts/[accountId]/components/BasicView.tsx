import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { crm_Opportunities } from "@prisma/client";
import {
  CalendarDays,
  ClipboardList,
  CoinsIcon,
  Combine,
  File,
  Globe,
  Globe2,
  Landmark,
  List,
  MoreHorizontal,
  Percent,
  Phone,
  SquareStack,
  Text,
  User,
} from "lucide-react";
import moment from "moment";
import { Clapperboard } from "lucide-react";
import { prismadb } from "@/lib/prisma";
import Link from "next/link";
import { EnvelopeClosedIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { LucideLandmark } from "lucide-react";
import { BasicViewActions } from "../../../components/BasicViewActions";
import { EmailClickWrapper } from "@/components/EmailClickWrapper";

interface OppsViewProps {
  data: any;
}

export async function BasicView({ data }: OppsViewProps) {
  //console.log(data, "data");
  const users = await prismadb.users.findMany();
  if (!data) return <div>Opportunity not found</div>;
  return (
    <div className="pb-3 space-y-5">
      {/*      <pre>{JSON.stringify(data, null, 2)}</pre> */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex w-full justify-between">
            <div>
              <CardTitle>{data.name}</CardTitle>
              <CardDescription>ID:{data.id}</CardDescription>
            </div>
            <div>
              <BasicViewActions module="accounts" entityId={data.id} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 w-full gap-5 ">
            <div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Annual revenue
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.annual_revenue}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <Landmark className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Company ID</p>
                  <p className="text-sm text-muted-foreground">
                    {data.company_id}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <Percent className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">VAT number</p>
                  <p className="text-sm text-muted-foreground">
                    {data.vat ? data.vat : "Not assigned"}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <File className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.description}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start justify-between space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <div className="flex mt-px gap-5">
                  <EnvelopeClosedIcon className="mt-px h-5 w-5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Email</p>
                    <EmailClickWrapper
                      email={data.email}
                      accountName={data.name}
                    />
                  </div>
                </div>
                <p className="pr-20"></p>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <Globe2 className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Website</p>
                  <p className="text-sm text-muted-foreground">
                    {data?.website ? (
                      <Link href={data.website}>{data.website}</Link>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <Phone className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Office phone
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.office_phone}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Fax</p>
                  <p className="text-sm text-muted-foreground">{data.fax}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <User className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Assigned to
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.assigned_to_user.name}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CalendarDays className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {moment(data.created_on).format("MMM DD YYYY")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Created by</p>
                  <p className="text-sm text-muted-foreground">
                    {users.find((user) => user.id === data.createdBy)?.name}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CalendarDays className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Last update
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {moment(data.updatedAt).format("MMM DD YYYY")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Last update by
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {users.find((user) => user.id === data.updatedBy)?.name}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <LightningBoltIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Status</p>
                  <p className="text-sm text-muted-foreground">{data.status}</p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Type</p>
                  <p className="text-sm text-muted-foreground">{data.type}</p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Member of</p>
                  <p className="text-sm text-muted-foreground">
                    {data.member_of}
                  </p>
                </div>
              </div>
              <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                <CoinsIcon className="mt-px h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Industry</p>
                  <p className="text-sm text-muted-foreground">
                    {data.industry}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 w-full">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Billing street
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.billing_street}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Billing postal code
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.billing_postal_code}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Billing city</p>
                <p className="text-sm text-muted-foreground">
                  {data.billing_city}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Billing state
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.billing_state}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Billing country
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.billing_country}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Shipping street
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.shipping_street}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Shipping postal code
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.shipping_postal_code}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Shipping city
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.shipping_city}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Shipping state
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.shipping_state}
                </p>
              </div>
            </div>
            <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Shipping country
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.shipping_country}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
