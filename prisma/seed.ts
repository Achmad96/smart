import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function renderTemplate(content: string, values: Record<string, string>): string {
  let rendered = content;
  for (const [key, value] of Object.entries(values)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
  }
  return rendered;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.correspondence.deleteMany();
  await prisma.template.deleteMany();

  // Create templates
  const officialLetter = await prisma.template.create({
    data: {
      name: "Official Letter",
      description:
        "A formal letter template for official correspondence with proper header, salutation, body, and signature block.",
      category: "official",
      fields: [
        { name: "letterNumber", label: "Letter Number", type: "text", required: true, placeholder: "e.g., 001/OFC/VI/2026" },
        { name: "date", label: "Date", type: "date", required: true, placeholder: "" },
        { name: "recipientName", label: "Recipient Name", type: "text", required: true, placeholder: "e.g., Mr. John Smith" },
        { name: "recipientTitle", label: "Recipient Title", type: "text", required: false, placeholder: "e.g., Director of Operations" },
        { name: "recipientOrganization", label: "Recipient Organization", type: "text", required: true, placeholder: "e.g., ABC Corporation" },
        { name: "recipientAddress", label: "Recipient Address", type: "textarea", required: true, placeholder: "Full address" },
        { name: "subject", label: "Subject", type: "text", required: true, placeholder: "Letter subject" },
        { name: "body", label: "Letter Body", type: "textarea", required: true, placeholder: "Main content of the letter" },
        { name: "senderName", label: "Sender Name", type: "text", required: true, placeholder: "Your full name" },
        { name: "senderTitle", label: "Sender Title", type: "text", required: true, placeholder: "Your position/title" },
      ],
      content: `OFFICIAL LETTER
Letter No: {{letterNumber}}
Date: {{date}}

To:
{{recipientName}}
{{recipientTitle}}
{{recipientOrganization}}
{{recipientAddress}}

Subject: {{subject}}

Dear {{recipientName}},

{{body}}

Sincerely,


{{senderName}}
{{senderTitle}}`,
    },
  });

  const internalMemo = await prisma.template.create({
    data: {
      name: "Internal Memo",
      description:
        "Inter-department communication template for internal announcements, policy updates, and team notifications.",
      category: "internal",
      fields: [
        { name: "memoNumber", label: "Memo Number", type: "text", required: true, placeholder: "e.g., MEMO/HR/001/2026" },
        { name: "date", label: "Date", type: "date", required: true, placeholder: "" },
        { name: "to", label: "To", type: "text", required: true, placeholder: "e.g., All Department Heads" },
        { name: "from", label: "From", type: "text", required: true, placeholder: "e.g., Human Resources Department" },
        { name: "subject", label: "Subject", type: "text", required: true, placeholder: "Memo subject" },
        { name: "body", label: "Content", type: "textarea", required: true, placeholder: "Memo content" },
        { name: "actionRequired", label: "Action Required", type: "textarea", required: false, placeholder: "Any actions needed from recipients" },
        { name: "deadline", label: "Deadline", type: "date", required: false, placeholder: "" },
      ],
      content: `INTERNAL MEMORANDUM
Memo No: {{memoNumber}}
Date: {{date}}

TO: {{to}}
FROM: {{from}}
SUBJECT: {{subject}}

{{body}}

Action Required:
{{actionRequired}}

Deadline: {{deadline}}

This memo is for internal use only.`,
    },
  });

  const meetingInvitation = await prisma.template.create({
    data: {
      name: "Meeting Invitation",
      description:
        "Professional meeting invitation with date, time, agenda, and attendee details for scheduling formal meetings.",
      category: "invitation",
      fields: [
        { name: "meetingTitle", label: "Meeting Title", type: "text", required: true, placeholder: "e.g., Q2 Budget Review" },
        { name: "date", label: "Meeting Date", type: "date", required: true, placeholder: "" },
        { name: "time", label: "Meeting Time", type: "text", required: true, placeholder: "e.g., 10:00 AM - 12:00 PM" },
        { name: "location", label: "Location", type: "text", required: true, placeholder: "e.g., Conference Room A / Zoom Link" },
        { name: "attendees", label: "Attendees", type: "textarea", required: true, placeholder: "List of attendees" },
        { name: "agenda", label: "Agenda", type: "textarea", required: true, placeholder: "Meeting agenda items" },
        { name: "notes", label: "Additional Notes", type: "textarea", required: false, placeholder: "Any additional information" },
        { name: "organizerName", label: "Organizer Name", type: "text", required: true, placeholder: "Meeting organizer" },
        { name: "organizerEmail", label: "Organizer Email", type: "email", required: true, placeholder: "organizer@company.com" },
      ],
      content: `MEETING INVITATION

{{meetingTitle}}

Date: {{date}}
Time: {{time}}
Location: {{location}}

Dear Attendees,

You are cordially invited to attend the above-mentioned meeting.

Attendees:
{{attendees}}

Agenda:
{{agenda}}

Additional Notes:
{{notes}}

Please confirm your attendance at your earliest convenience.

Best regards,
{{organizerName}}
{{organizerEmail}}`,
    },
  });

  const requestLetter = await prisma.template.create({
    data: {
      name: "Request Letter",
      description:
        "Formal request template with justification section for budget requests, resource allocation, or approval requests.",
      category: "request",
      fields: [
        { name: "requestNumber", label: "Request Number", type: "text", required: true, placeholder: "e.g., REQ/2026/001" },
        { name: "date", label: "Date", type: "date", required: true, placeholder: "" },
        { name: "recipientName", label: "Recipient Name", type: "text", required: true, placeholder: "Approving authority name" },
        { name: "recipientTitle", label: "Recipient Title", type: "text", required: true, placeholder: "Approving authority title" },
        { name: "requestType", label: "Request Type", type: "text", required: true, placeholder: "e.g., Budget Allocation, Equipment Purchase" },
        { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Detailed description of the request" },
        { name: "justification", label: "Justification", type: "textarea", required: true, placeholder: "Why this request is needed" },
        { name: "estimatedCost", label: "Estimated Cost", type: "text", required: false, placeholder: "e.g., $5,000" },
        { name: "requesterName", label: "Requester Name", type: "text", required: true, placeholder: "Your name" },
        { name: "department", label: "Department", type: "text", required: true, placeholder: "Your department" },
      ],
      content: `REQUEST LETTER
Request No: {{requestNumber}}
Date: {{date}}

To:
{{recipientName}}
{{recipientTitle}}

Subject: Request for {{requestType}}

Dear {{recipientName}},

I am writing to formally request the following:

Description:
{{description}}

Justification:
{{justification}}

Estimated Cost: {{estimatedCost}}

I kindly request your approval for the above. Please do not hesitate to contact me if you require any additional information.

Respectfully,

{{requesterName}}
{{department}}`,
    },
  });

  const notificationLetter = await prisma.template.create({
    data: {
      name: "Notification Letter",
      description:
        "Announcement and notification template for policy changes, important updates, or formal notifications to stakeholders.",
      category: "notification",
      fields: [
        { name: "notificationNumber", label: "Notification Number", type: "text", required: true, placeholder: "e.g., NTF/2026/001" },
        { name: "date", label: "Date", type: "date", required: true, placeholder: "" },
        { name: "recipientGroup", label: "Recipient Group", type: "text", required: true, placeholder: "e.g., All Employees" },
        { name: "subject", label: "Subject", type: "text", required: true, placeholder: "Notification subject" },
        { name: "effectiveDate", label: "Effective Date", type: "date", required: true, placeholder: "" },
        { name: "body", label: "Notification Content", type: "textarea", required: true, placeholder: "Main notification content" },
        { name: "impact", label: "Impact / Changes", type: "textarea", required: false, placeholder: "What changes will take effect" },
        { name: "contactPerson", label: "Contact Person", type: "text", required: true, placeholder: "Person to contact for questions" },
        { name: "contactEmail", label: "Contact Email", type: "email", required: true, placeholder: "contact@company.com" },
      ],
      content: `NOTIFICATION
Notification No: {{notificationNumber}}
Date: {{date}}

To: {{recipientGroup}}

Subject: {{subject}}

This is to notify all concerned parties of the following:

{{body}}

Effective Date: {{effectiveDate}}

Impact / Changes:
{{impact}}

For questions or clarifications, please contact:
{{contactPerson}} — {{contactEmail}}

Thank you for your attention to this matter.

Management`,
    },
  });

  const permitLetter = await prisma.template.create({
    data: {
      name: "Permit / Authorization",
      description:
        "Authorization document template for permits, approvals, or formal authorization of activities and access.",
      category: "permit",
      fields: [
        { name: "permitNumber", label: "Permit Number", type: "text", required: true, placeholder: "e.g., PRM/2026/001" },
        { name: "date", label: "Issue Date", type: "date", required: true, placeholder: "" },
        { name: "grantedTo", label: "Granted To", type: "text", required: true, placeholder: "Person / entity receiving the permit" },
        { name: "grantedToTitle", label: "Position / Role", type: "text", required: false, placeholder: "Title or role" },
        { name: "permitType", label: "Permit Type", type: "text", required: true, placeholder: "e.g., Access Authorization, Work Permit" },
        { name: "description", label: "Description", type: "textarea", required: true, placeholder: "What is being authorized" },
        { name: "validFrom", label: "Valid From", type: "date", required: true, placeholder: "" },
        { name: "validUntil", label: "Valid Until", type: "date", required: true, placeholder: "" },
        { name: "conditions", label: "Terms & Conditions", type: "textarea", required: false, placeholder: "Any conditions or restrictions" },
        { name: "authorizedBy", label: "Authorized By", type: "text", required: true, placeholder: "Authorizing person name" },
        { name: "authorizedByTitle", label: "Authorizer Title", type: "text", required: true, placeholder: "Position of authorizing person" },
      ],
      content: `PERMIT / AUTHORIZATION
Permit No: {{permitNumber}}
Date: {{date}}

AUTHORIZATION CERTIFICATE

This document hereby authorizes:

Name: {{grantedTo}}
Position: {{grantedToTitle}}

Permit Type: {{permitType}}

Description:
{{description}}

Validity Period:
From: {{validFrom}}
Until: {{validUntil}}

Terms & Conditions:
{{conditions}}

This authorization is subject to the terms and conditions stated above.

Authorized By:

{{authorizedBy}}
{{authorizedByTitle}}`,
    },
  });

  // Create some sample correspondences
  const budgetFieldValues: Record<string, string> = {
    requestNumber: "REQ/2026/042",
    date: "2026-06-15",
    recipientName: "Sarah Johnson",
    recipientTitle: "Finance Director",
    requestType: "Q2 Budget Increase",
    description:
      "Requesting a budget increase of $15,000 for the marketing department to cover additional digital advertising campaigns planned for Q2 2026.",
    justification:
      "The current Q2 marketing budget does not account for the new product launch campaign. This additional funding will support targeted social media ads, Google Ads, and influencer partnerships expected to generate a 25% increase in lead generation.",
    estimatedCost: "$15,000",
    requesterName: "Michael Chen",
    department: "Marketing Department",
  };
  await prisma.correspondence.create({
    data: {
      title: "Q2 Budget Request to Finance Director",
      templateId: requestLetter.id,
      fieldValues: budgetFieldValues,
      renderedContent: renderTemplate(requestLetter.content, budgetFieldValues),
      status: "submitted",
      submittedAt: new Date("2026-06-15"),
    },
  });

  const teamBuildingFieldValues: Record<string, string> = {
    meetingTitle: "Annual Team Building Day",
    date: "2026-07-10",
    time: "9:00 AM - 5:00 PM",
    location: "Riverside Resort & Conference Center",
    attendees: "All departments - Full team participation encouraged",
    agenda:
      "1. Welcome & Icebreakers (9:00-10:00)\n2. Team Challenges (10:00-12:00)\n3. Lunch Break (12:00-1:00)\n4. Workshop Sessions (1:00-3:00)\n5. Awards & Closing (3:00-5:00)",
    notes: "Casual dress code. Transportation will be provided from the main office at 8:00 AM.",
    organizerName: "Emily Rodriguez",
    organizerEmail: "emily.rodriguez@company.com",
  };
  await prisma.correspondence.create({
    data: {
      title: "Team Building Event Invitation",
      templateId: meetingInvitation.id,
      fieldValues: teamBuildingFieldValues,
      renderedContent: renderTemplate(meetingInvitation.content, teamBuildingFieldValues),
      status: "approved",
      submittedAt: new Date("2026-06-10"),
      reviewedAt: new Date("2026-06-12"),
    },
  });

  const itPolicyFieldValues: Record<string, string> = {
    notificationNumber: "NTF/2026/018",
    date: "2026-06-18",
    recipientGroup: "All Employees",
    subject: "Updated Password Security Policy",
    effectiveDate: "2026-07-01",
    body: "Please be informed that the company's password security policy has been updated to comply with the latest ISO 27001 standards. All employees are required to update their passwords before the effective date.",
    impact:
      "1. Minimum password length increased to 12 characters\n2. Two-factor authentication now mandatory for all systems\n3. Password rotation required every 90 days\n4. Previous 10 passwords cannot be reused",
    contactPerson: "David Kim",
    contactEmail: "david.kim@company.com",
  };
  await prisma.correspondence.create({
    data: {
      title: "IT Policy Update Notice",
      templateId: notificationLetter.id,
      fieldValues: itPolicyFieldValues,
      renderedContent: renderTemplate(notificationLetter.content, itPolicyFieldValues),
      status: "submitted",
      submittedAt: new Date("2026-06-18"),
    },
  });

  const serverAccessFieldValues: Record<string, string> = {
    permitNumber: "PRM/2026/007",
    date: "2026-06-14",
    grantedTo: "Alex Turner",
    grantedToTitle: "Senior Systems Administrator",
    permitType: "Server Room Access Authorization",
    description:
      "Full access to the main server room (Building A, Floor 2) for maintenance, monitoring, and emergency response purposes.",
    validFrom: "2026-06-15",
    validUntil: "2026-12-31",
    conditions:
      "1. Access limited to authorized maintenance windows unless emergency\n2. Must sign in/out at security desk\n3. No unauthorized personnel allowed\n4. Emergency protocols must be followed at all times",
    authorizedBy: "Robert Martinez",
    authorizedByTitle: "Chief Technology Officer",
  };
  await prisma.correspondence.create({
    data: {
      title: "Server Room Access Authorization",
      templateId: permitLetter.id,
      fieldValues: serverAccessFieldValues,
      renderedContent: renderTemplate(permitLetter.content, serverAccessFieldValues),
      status: "approved",
      submittedAt: new Date("2026-06-14"),
      reviewedAt: new Date("2026-06-14"),
    },
  });

  console.log("✅ Seed data created successfully!");
  console.log(`   📄 Templates: ${6}`);
  console.log(`   📨 Sample correspondences: ${4}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
