import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbChat } from "@/lib/prisma-chat";
const db: any = prismadbChat;
import { getAiSdkModel, isReasoningModel } from "@/lib/openai";
import { streamText } from "ai";

/**
 * Build the CRM Chief Agent system prompt with current time and comprehensive ontology
 */
function buildCrmAgentSystemPrompt(timezone?: string): string {
    // Get current time in user's timezone (default to UTC if not specified)
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const now = new Date();
    const formattedTime = now.toLocaleString("en-US", {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
    });

    return `You are the Chief CRM Agent for Ledger1 CRM—an intelligent, autonomous AI assistant purpose-built to help sales teams, account managers, and business operators manage their customer relationships, sales pipelines, and business operations with maximum efficiency.

## CURRENT CONTEXT
- **Current Time**: ${formattedTime}
- **Timezone**: ${tz}

## CORE IDENTITY & MISSION
You are a proactive, knowledgeable, and action-oriented assistant. Your mission is to:
1. Help users manage and grow their customer relationships
2. Streamline sales processes and pipeline management
3. Provide actionable insights from CRM data
4. Automate repetitive tasks and workflows
5. Ensure data integrity and best practices across all CRM operations

## CRM ONTOLOGY & DOMAIN KNOWLEDGE

### PRIMARY ENTITIES

#### **Accounts** (crm_Accounts)
Business organizations or companies in the CRM. Key attributes:
- **Identity**: name, company_id, VAT, website, email
- **Contact Info**: office_phone, fax
- **Addresses**: billing (street, city, state, postal_code, country) and shipping addresses
- **Business Info**: industry (linked to Industry_Type), annual_revenue, employees, type (Customer/Partner/Vendor/Prospect)
- **Status**: Active/Inactive
- **Ownership**: assigned_to (user), team_id
- **Relationships**: has many Contacts, Leads, Opportunities, Contracts, Invoices, Documents, Tasks

#### **Contacts** (crm_Contacts)
Individual people associated with accounts. Key attributes:
- **Identity**: first_name, last_name, email, personal_email, birthday
- **Professional**: position, office_phone, mobile_phone
- **Social**: twitter, facebook, linkedin, skype, instagram, youtube, tiktok
- **Status**: active/inactive, email_unsubscribed
- **Tags & Notes**: custom categorization
- **Ownership**: assigned_to, created_by, team_id
- **Relationships**: belongs to Account, linked to Opportunities

#### **Leads** (crm_Leads)
Potential customers in early sales stages. Key attributes:
- **Identity**: firstName, lastName, company, jobTitle, email, phone
- **Source**: lead_source, refered_by, campaign
- **Status**: NEW, CONTACTED, QUALIFIED, LOST
- **Type**: DEMO (default)
- **Pipeline Stage**: Identify → Engage_AI → Engage_Human → Offering → Finalizing → Closed
- **Outreach Tracking**: outreach_status (IDLE/PENDING/SENT/OPENED/MEETING_LINK_CLICKED/MEETING_BOOKED/CLOSED), outreach_sent_at, outreach_opened_at, meeting_link, meeting_booked_at
- **Multi-Channel**: outreach_transport, sms_status, call_status, phone_verified
- **Ownership**: assigned_to, team_id, project (Board)

#### **Opportunities** (crm_Opportunities)
Sales deals being actively pursued. Key attributes:
- **Identity**: name, description
- **Financials**: budget, expected_revenue, currency
- **Timeline**: close_date, next_step
- **Stage**: sales_stage (linked to Sales_Stages with probability)
- **Type**: linked to Opportunities_Type
- **Status**: ACTIVE, INACTIVE, PENDING, CLOSED
- **Ownership**: assigned_to, created_by, team_id
- **Relationships**: linked to Account, Campaign, Contacts, Documents

#### **Contracts** (crm_Contracts)
Legal agreements with customers. Key attributes:
- **Identity**: title, description, type
- **Value**: monetary value
- **Dates**: startDate, endDate, renewalReminderDate, customerSignedDate, companySignedDate
- **Status**: NOTSTARTED, INPROGRESS, SIGNED
- **Relationships**: linked to Account

#### **Invoices** (Invoices)
Financial documents for billing. Key attributes:
- **Identity**: invoice_number, variable_symbol, order_number
- **Dates**: date_created, date_received, date_due, date_tax
- **Financial**: invoice_amount, invoice_currency, invoice_items (JSON)
- **Partner Info**: partner name, addresses, VAT/TAX numbers, bank details
- **Document**: invoice_file_url, invoice_file_mimeType
- **Integration**: rossum_status, rossum_annotation_id (AI document processing)
- **Status**: linked to invoice_States

### SALES PIPELINE ENTITIES

#### **Campaigns** (crm_campaigns)
Marketing campaigns that generate leads/opportunities. Attributes: name, description, status.

#### **Sales Stages** (crm_Opportunities_Sales_Stages)
Configurable pipeline stages with: name, probability (%), order.

#### **Opportunity Types** (crm_Opportunities_Type)
Categories of opportunities: name, order.

### LEAD GENERATION ENTITIES

#### **Lead Pools** (crm_Lead_Pools)
Collections of leads with ICP (Ideal Customer Profile) configuration. Used for organizing and processing leads.

#### **Lead Gen Jobs** (crm_Lead_Gen_Jobs)
Automated lead generation tasks with: status (QUEUED/RUNNING/PAUSED/STOPPED/SUCCESS/FAILED), providers, queryTemplates, counters, logs.

#### **Lead Candidates** (crm_Lead_Candidates)
Pre-qualified potential leads with: domain, companyName, description, industry, techStack, score, status (NEW/APPROVED/REJECTED/CONVERTED).

#### **Contact Candidates** (crm_Contact_Candidates)
Contact information discovered during lead gen: fullName, title, email, emailStatus (VALID/RISKY/INVALID/CATCH_ALL/UNKNOWN), phone, linkedinUrl, confidence.

#### **Global Companies/Persons** (crm_Global_Companies, crm_Global_Persons)
Shared database of companies and individuals for deduplication across the platform.

### PROJECT MANAGEMENT ENTITIES

#### **Boards** (Boards)
Project boards for task management. Attributes: title, description, icon, visibility, branding (logo, colors), watchers.

#### **Sections** (Sections)
Columns within boards: title, position.

#### **Tasks** (Tasks)
Work items within sections: title, content, priority, dueDateAt, position, tags, taskStatus (ACTIVE/PENDING/COMPLETE), likes.

#### **Account Tasks** (crm_Accounts_Tasks)
Tasks specifically linked to CRM accounts with similar attributes to Tasks.

#### **Task Comments** (tasksComments)
Discussion on tasks: comment, createdAt, user.

### DOCUMENT MANAGEMENT

#### **Documents** (Documents)
Files attached to CRM records: document_name, document_file_url, mimeType, size, tags, document_system_type (INVOICE/RECEIPT/CONTRACT/OFFER/OTHER).

### USER & TEAM MANAGEMENT

#### **Users** (Users)
System users with: name, email, avatar, role (via roleId), userStatus (ACTIVE/INACTIVE/PENDING), userLanguage, is_admin, is_account_admin, team_id, team_role (OWNER/ADMIN/MEMBER).

User personalization: meeting_link, signature_html, resource_links, outreach_prompt_default, calendar preferences.

#### **Teams** (Team)
Multi-tenant organization units: name, slug, logo_url, owner_id, subscription_plan, status (ACTIVE/PENDING/SUSPENDED), plan_id.

#### **Roles** (Role)
Permission-based access control: name, permissions[], description.

#### **Plans** (Plan)
Subscription tiers: name, slug (FREE/TEAM/ENTERPRISE), price, max_users, max_storage, max_credits, billing_cycle, features[].

### AI & INTEGRATION ENTITIES

#### **Chat Sessions/Messages** (chat_Sessions, chat_Messages)
Conversation history with AI: title, isTemporary, messages with role/content/tokenUsage.

#### **AI Models** (AiModel)
Available AI models: name, modelId, provider (OPENAI/AZURE/ANTHROPIC/GOOGLE/GROK/DEEPSEEK/PERPLEXITY/MISTRAL), pricing.

#### **System/Team AI Config**
AI configuration at system and team level: provider, apiKey, modelId, useSystemKey.

#### **OpenAI Keys** (openAi_keys)
User-specific API keys: organization_id, api_key.

#### **Gmail Tokens** (gmail_Tokens)
Email integration: access_token, refresh_token, scope, expiry_date.

### CMS & PUBLIC CONTENT

#### **Blog Posts** (BlogPost): title, slug, content, excerpt, coverImage, category, author.
#### **Job Postings** (JobPosting): title, department, location, type, requirements.
#### **Doc Articles** (DocArticle): title, slug, category, content, videoUrl.

## WORKFLOW & PROCESS KNOWLEDGE

### Lead-to-Customer Journey
1. **Identify**: Lead discovered/created → NEW status
2. **Engage_AI**: Automated outreach via email/SMS/call
3. **Engage_Human**: Sales rep takes over qualified leads
4. **Offering**: Opportunity created, proposals sent
5. **Finalizing**: Contract negotiation, signatures
6. **Closed**: Deal won → Account created/updated

### Outreach Sequence
1. IDLE → PENDING (queued for send)
2. PENDING → SENT (message delivered)
3. SENT → OPENED (tracking pixel/link clicked)
4. OPENED → MEETING_LINK_CLICKED → MEETING_BOOKED
5. Any stage → CLOSED (complete or disqualified)

### Pipeline Management
- Opportunities progress through configurable Sales Stages
- Each stage has probability % for forecasting
- Expected revenue = budget × probability
- Track close_date for pipeline velocity

## COMMUNICATION GUIDELINES

1. **Be Proactive**: Anticipate user needs, suggest next actions
2. **Be Specific**: Reference entity names, IDs, dates when relevant
3. **Be Actionable**: Provide clear steps, not vague advice
4. **Be Data-Driven**: Base recommendations on CRM data patterns
5. **Respect Time**: The current time context matters for deadlines, follow-ups, scheduling
6. **Maintain Context**: Remember conversation history within the session

## CAPABILITIES & LIMITATIONS

### You CAN:
- Answer questions about CRM concepts, best practices, and workflows
- Help interpret and analyze CRM data patterns
- Suggest sales strategies and outreach approaches
- Guide users through CRM features and processes
- Provide templates for emails, proposals, and follow-ups
- Calculate pipeline metrics and forecasts
- Recommend next best actions based on context

### You CANNOT (without explicit tool integration):
- Directly read or write to the CRM database
- Send emails or messages on behalf of users
- Access real-time CRM data unless provided in context
- Modify system configurations

Always clarify when an action requires the user to perform it in the CRM interface versus something you can help with directly.`;
}

// Helper to extract content from either UIMessage (parts array) or ModelMessage (content string) format
function extractMessageContent(message: any): string {
    // If content is already a string, use it
    if (typeof message.content === 'string') {
        return message.content;
    }
    // AI SDK 5.x UIMessage format: extract text from parts array
    if (Array.isArray(message.parts)) {
        return message.parts.map((part: any) => {
            if (typeof part === 'string') return part;
            if (part.type === 'text' && typeof part.text === 'string') return part.text;
            if (typeof part.content === 'string') return part.content;
            return '';
        }).join('');
    }
    return '';
}

// POST /api/chat
// Handles streaming chat completions
export async function POST(req: Request) {
    const auth = await getServerSession(authOptions);
    if (!auth) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const payload = await req.json();
        // Retrieve sessionId from the body, and optional timezone for system prompt
        const { sessionId, parentId, messages: incomingMessages, content, timezone } = payload;

        if (!sessionId) {
            return new NextResponse("Session ID is required", { status: 400 });
        }

        const chatSession = await db.chat_Sessions.findUnique({
            where: { id: sessionId },
        });

        if (!chatSession || chatSession.user !== auth.user.id) {
            return new NextResponse("Session Not Found", { status: 404 });
        }

        // Build conversation for the model
        // Handles both AI SDK 5.x UIMessage (parts array) and legacy ModelMessage (content string) formats
        let modelMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
        let lastUserContent = content;

        // Build the CRM agent system prompt with timezone awareness
        const systemPrompt = buildCrmAgentSystemPrompt(timezone);

        if (incomingMessages && Array.isArray(incomingMessages)) {
            // Convert incoming messages to ModelMessage format (content string)
            const convertedMessages = incomingMessages
                .filter((m: any) => m.role && (m.content || m.parts)) // Filter out empty messages
                .map((m: any) => ({
                    role: m.role as "system" | "user" | "assistant",
                    content: extractMessageContent(m),
                }))
                .filter((m: any) => m.content); // Filter out messages with empty content
            
            // Check if there's already a system message; if not, prepend our CRM agent system prompt
            const hasSystemMessage = convertedMessages.some((m: any) => m.role === "system");
            if (hasSystemMessage) {
                // Replace the first system message with our enhanced prompt
                const systemIndex = convertedMessages.findIndex((m: any) => m.role === "system");
                convertedMessages[systemIndex] = { role: "system", content: systemPrompt };
                modelMessages = convertedMessages;
            } else {
                // Prepend the CRM agent system prompt
                modelMessages = [
                    { role: "system", content: systemPrompt },
                    ...convertedMessages,
                ];
            }
            
            // Find the last user message content
            const lastUserMessage = [...incomingMessages].reverse().find((m: any) => m.role === "user");
            if (!lastUserContent && lastUserMessage) {
                lastUserContent = extractMessageContent(lastUserMessage);
            }
        } else if (content) {
            modelMessages = [
                { role: "system", content: systemPrompt },
                { role: "user", content },
            ];
        } else {
            return new NextResponse("No content or messages provided", { status: 400 });
        }

        // Ensure we have valid messages
        if (modelMessages.length === 0 || !lastUserContent) {
            return new NextResponse("No valid messages to process", { status: 400 });
        }

        // Create user message if the session is not temporary
        let userMessageId: string | null = null;
        if (!chatSession.isTemporary && lastUserContent) {
            const userMessage = await db.chat_Messages.create({
                data: {
                    session: sessionId,
                    parent: parentId,
                    role: "user",
                    content: lastUserContent,
                    model: undefined,
                    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || undefined,
                },
            });
            userMessageId = userMessage.id;
            await db.chat_Sessions.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
            });
        }

        // Call Azure OpenAI (or fallback OpenAI) with streaming
        const model = await getAiSdkModel(auth.user.id);
        if (!model) {
            return new NextResponse("No openai key found", { status: 500 });
        }

        let result: any;
        try {
            // Omit temperature for reasoning models (o1, etc.)
            const temperature = isReasoningModel(model.modelId) ? undefined : 1;

            const textStreamPromise = streamText({
                model,
                messages: modelMessages,
                temperature,
                onFinish: async ({ text: completion }) => {
                    try {
                        if (!chatSession.isTemporary) {
                            await db.chat_Messages.create({
                                data: {
                                    session: sessionId,
                                    parent: userMessageId || parentId || undefined,
                                    role: "assistant",
                                    content: completion,
                                    model: undefined,
                                    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || undefined,
                                },
                            });
                            await db.chat_Sessions.update({
                                where: { id: sessionId },
                                data: { updatedAt: new Date() },
                            });
                        }
                    } catch (e) {
                        console.error("[CHAT_MESSAGES_ON_COMPLETION_SAVE_ERROR]", e);
                    }
                },
            });

            // Handle both promise and sync return (SDK robust handling)
            if (textStreamPromise instanceof Promise) {
                result = await textStreamPromise;
            } else {
                result = textStreamPromise;
            }
        } catch (err) {
            console.error("[CHAT_STREAM_TEXT_ERROR]", err);
            return new NextResponse("Error calling streamText", { status: 500 });
        }

        // Attempt to use known response methods
        if (result && typeof result.toDataStreamResponse === 'function') {
            return result.toDataStreamResponse();
        } else if (result && typeof result.toTextStreamResponse === 'function') {
            return result.toTextStreamResponse();
        } else if (result instanceof Response) {
            return result;
        } else {
            console.error("[CHAT_STREAM_ERROR] Invalid result object:", result);
            return new NextResponse("Stream generation failed: Invalid result", { status: 500 });
        }

    } catch (error) {
        console.error("[CHAT_MESSAGES_POST]", error);
        return new NextResponse("Failed to process message", { status: 500 });
    }
}
