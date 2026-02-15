import { prismadb } from "@/lib/prisma";

/**
 * Ensures a Contact exists for the given Lead once the pipeline stage moves beyond Identify.
 * - Idempotent: uses a tag leadId:<leadId> to avoid duplicates.
 * - Applies tags for lead pool(s) and the linked project/board (title + id).
 * - Assigns the contact to the lead's assigned user and links to the lead's account if present.
 */
export async function ensureContactForLead(leadId: string): Promise<string | null> {
  if (!leadId) return null;

  // Load lead
  const lead: any = await prismadb.crm_Leads.findUnique({
    where: { id: leadId },
  });
  if (!lead) return null;

  // Only proceed if beyond Identify
  const stageOrder: Record<string, number> = {
    Identify: 0,
    Engage_AI: 1,
    Engage_Human: 2,
    Offering: 3,
    Finalizing: 4,
    Closed: 5,
  };
  const stage = (lead.pipeline_stage as unknown as string) || "Identify";
  if (stageOrder[stage] <= stageOrder["Identify"]) return null;

  const tagLead = `leadId:${lead.id}`;

  // Check if we already created a contact for this lead
  const existing = await prismadb.crm_Contacts.findFirst({
    where: { tags: { has: tagLead } },
    select: { id: true, tags: true },
  });

  // Build tags
  const tags: string[] = existing?.tags ? [...existing.tags] : [];
  if (!tags.includes(tagLead)) tags.push(tagLead);

  // Add pool tags (can be multiple)
  const poolMaps = await prismadb.crm_Lead_Pools_Leads.findMany({
    where: { lead: lead.id },
    include: { assigned_pool: { select: { id: true, name: true } } },
  });
  for (const map of poolMaps) {
    const poolTitle = map.assigned_pool?.name || map.assigned_pool?.id || map.pool;
    if (poolTitle) {
      const poolTag = `lead_pool:${poolTitle}`;
      if (!tags.includes(poolTag)) tags.push(poolTag);
    }
  }

  // Add project tags
  if (lead.project) {
    const board = await prismadb.boards.findUnique({
      where: { id: lead.project },
      select: { id: true, title: true },
    });
    if (board) {
      const projectTag = `project:${board.title}`;
      const projectIdTag = `projectId:${board.id}`;
      if (!tags.includes(projectTag)) tags.push(projectTag);
      if (!tags.includes(projectIdTag)) tags.push(projectIdTag);
    } else {
      const projectIdTag = `projectId:${lead.project}`;
      if (!tags.includes(projectIdTag)) tags.push(projectIdTag);
    }
  }

  // Create or update the contact
  if (existing?.id) {
    await prismadb.crm_Contacts.update({
      where: { id: existing.id },
      data: {
        assigned_to: lead.assigned_to || undefined,
        accountsIDs: lead.accountsIDs || undefined,
        tags,
        // opportunistic updates
        first_name: lead.firstName || undefined,
        last_name: lead.lastName || undefined,
        email: lead.email || undefined,
        mobile_phone: lead.phone || undefined,
        position: lead.jobTitle || undefined,
        description: lead.description || undefined,
      },
    });

    // Log lead activity
    await prismadb.crm_Lead_Activities.create({
      data: {
        lead: lead.id,
        user: lead.assigned_to || undefined,
        type: "contact_synced",
        metadata: { contactId: existing.id, tags } as any,
      },
    });

    return existing.id;
  } else {
    const contact = await prismadb.crm_Contacts.create({
      data: {
        v: 1,
        assigned_to: lead.assigned_to || undefined,
        accountsIDs: lead.accountsIDs || undefined,
        first_name: lead.firstName || undefined,
        last_name: lead.lastName || "Unknown",
        email: lead.email || undefined,
        mobile_phone: lead.phone || undefined,
        position: lead.jobTitle || undefined,
        description: lead.description || undefined,
        type: "Prospect",
        tags,
      },
    });

    // Log lead activity
    await prismadb.crm_Lead_Activities.create({
      data: {
        lead: lead.id,
        user: lead.assigned_to || undefined,
        type: "contact_created",
        metadata: { contactId: contact.id, tags } as any,
      },
    });

    return contact.id;
  }
}

/**
 * Ensures an Account exists when a Lead is closed.
 * - If the lead already links to an account, returns it.
 * - Otherwise creates an Account, links the Lead, and updates any Contact created from the lead to link the account.
 */
export async function ensureAccountForLead(leadId: string): Promise<string | null> {
  if (!leadId) return null;

  const lead: any = await prismadb.crm_Leads.findUnique({
    where: { id: leadId },
  });
  if (!lead) return null;

  // If already linked to an account, ensure visibility and return
  if (lead.accountsIDs) {
    return lead.accountsIDs;
  }

  // Create account from lead data
  const name = lead.company?.trim() || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || `Lead ${lead.id}`;
  const account = await prismadb.crm_Accounts.create({
    data: {
      v: 1,
      name,
      email: lead.email || undefined,
      office_phone: (lead.phone || undefined) as any,
      status: "Active" as any,
      type: "Customer" as any,
      assigned_to: lead.assigned_to || undefined,
      createdBy: lead.assigned_to || undefined,
    },
  });

  // Log account creation
  await prismadb.crm_Lead_Activities.create({
    data: {
      lead: lead.id,
      user: lead.assigned_to || undefined,
      type: "account_created",
      metadata: { accountId: account.id } as any,
    },
  });

  // Link lead to account
  await prismadb.crm_Leads.update({
    where: { id: lead.id },
    data: { accountsIDs: account.id },
  });

  // Link contact (if exists) to account
  const tagLead = `leadId:${lead.id}`;
  const contactFromLead = await prismadb.crm_Contacts.findFirst({
    where: { tags: { has: tagLead } },
    select: { id: true },
  });
  if (contactFromLead?.id) {
    await prismadb.crm_Contacts.update({
      where: { id: contactFromLead.id },
      data: { accountsIDs: account.id },
    });
  }

  return account.id;
}
