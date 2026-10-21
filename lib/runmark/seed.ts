import type { Playbook, PlaybookStep } from "./model";

const step = (input: Partial<PlaybookStep> & Pick<PlaybookStep, "id" | "title" | "instructions">): PlaybookStep => ({
  type: "action",
  context: "",
  warning: "",
  checks: [],
  variables: [],
  condition: null,
  attachments: [],
  ...input,
});

export const transitGatewayPlaybook: Playbook = {
  id: "sample-transit-gateway-migration",
  title: "Transit Gateway Migration",
  description: "Move a child VPC from an old transit gateway to a newly shared TGW, then restore on-premises connectivity.",
  version: 1,
  status: "ready",
  createdAt: "2026-10-08T00:00:00.000Z",
  updatedAt: "2026-10-08T00:00:00.000Z",
  steps: [
    step({
      id: "tgw-share",
      title: "Share the new transit gateway",
      instructions: "In the new TGW account, create a RAM resource share for the child account.",
      context: "New TGW account",
      variables: [
        { id: "var-tgw-account", key: "tgwAccount", label: "New TGW account ID", type: "text", placeholder: "123456789012", options: [], required: true },
        { id: "var-child-account", key: "childAccount", label: "Child account ID", type: "text", placeholder: "210987654321", options: [], required: true },
        { id: "var-tgw-id", key: "tgwId", label: "New TGW ID", type: "text", placeholder: "tgw-0123456789abcdef0", options: [], required: true },
      ],
      checks: [
        { id: "check-share", label: "RAM resource share created", detail: "Confirm the new TGW is included." },
        { id: "check-principal", label: "Child account added as a principal", detail: "Verify the account ID before sending." },
      ],
    }),
    step({
      id: "tgw-accept",
      title: "Accept the RAM invitation",
      instructions: "Switch to the child account and accept the transit gateway resource share.",
      context: "Child account",
      checks: [
        { id: "check-invite-visible", label: "Invitation is visible in RAM", detail: "" },
        { id: "check-invite-accepted", label: "Resource share status is Accepted", detail: "" },
      ],
    }),
    step({
      id: "tgw-preflight",
      type: "decision",
      title: "Inspect the child VPC",
      instructions: "Record the current attachment, subnet, and routing state before changing anything.",
      context: "Child account",
      variables: [
        { id: "var-vpc-id", key: "vpcId", label: "Child VPC ID", type: "text", placeholder: "vpc-0123456789abcdef0", options: [], required: true },
        { id: "var-existing-attachment", key: "hasExistingAttachment", label: "Existing TGW attachment?", type: "choice", placeholder: "Choose", options: ["Yes", "No"], required: true },
        { id: "var-attachment-subnets", key: "hasAttachmentSubnets", label: "Attachment subnets ready?", type: "choice", placeholder: "Choose", options: ["Yes", "No"], required: true },
      ],
      checks: [
        { id: "check-attachments", label: "Existing TGW attachments checked", detail: "" },
        { id: "check-old-routes", label: "Routes to the old TGW recorded", detail: "Keep this list as the rollback reference." },
      ],
    }),
    step({
      id: "tgw-create-subnet",
      title: "Create an attachment subnet",
      instructions: "Create a dedicated /28 subnet in the required Availability Zone before creating the attachment.",
      context: "Child account",
      condition: { variableKey: "hasAttachmentSubnets", equals: "No" },
      checks: [{ id: "check-subnet-created", label: "Dedicated /28 attachment subnet created", detail: "" }],
    }),
    step({
      id: "tgw-attach",
      title: "Create the new TGW attachment",
      instructions: "Create the VPC attachment using the dedicated TGW attachment subnets.",
      context: "Child + TGW accounts",
      variables: [
        { id: "var-subnet-ids", key: "attachmentSubnets", label: "Attachment subnet IDs", type: "text", placeholder: "subnet-… , subnet-…", options: [], required: true },
      ],
      checks: [
        { id: "check-subnet-selection", label: "Dedicated TGW subnets selected", detail: "" },
        { id: "check-pending", label: "Attachment appears as Pending in both accounts", detail: "" },
        { id: "check-name", label: "Attachment name updated clearly", detail: "" },
      ],
    }),
    step({
      id: "tgw-cutover",
      title: "Move routes to the new TGW",
      instructions: "Wait for the attachment, inspect associated route tables, then replace the old TGW targets.",
      context: "Child account",
      warning: "Do not change routes while the new attachment is Pending. The recorded old targets are your rollback path.",
      variables: [
        { id: "var-old-route-tables", key: "oldRouteTables", label: "Old TGW route tables", type: "text", placeholder: "rtb-… , rtb-…", options: [], required: true },
      ],
      checks: [
        { id: "check-available", label: "New attachment state is Available", detail: "" },
        { id: "check-route-tables", label: "Associated route tables reviewed in the VPC map", detail: "" },
        { id: "check-routes-updated", label: "Old TGW route targets replaced", detail: "" },
      ],
    }),
    step({
      id: "tgw-verify",
      type: "check",
      title: "Confirm propagated routes",
      instructions: "Auto propagation should publish each child VPC route after its attachment becomes available.",
      context: "New TGW account",
      checks: [
        { id: "check-propagated", label: "Child VPC prefixes appear in the TGW route table", detail: "" },
        { id: "check-child-routes", label: "Child subnet routes point to the new TGW", detail: "" },
      ],
    }),
    step({
      id: "tgw-direct-connect",
      type: "warning",
      title: "Update Direct Connect prefixes",
      instructions: "Add the migrated VPC prefixes to establish the AWS-to-on-premises path through the new TGW.",
      context: "Direct Connect / TGW",
      warning: "This is deliberately the final change. Updating return routes earlier can create asymmetric traffic or an outage.",
      variables: [
        { id: "var-prefixes", key: "vpcPrefixes", label: "Direct Connect VPC prefixes", type: "text", placeholder: "10.20.0.0/16", options: [], required: true },
      ],
      checks: [
        { id: "check-stable", label: "AWS-side migration validated first", detail: "" },
        { id: "check-prefixes", label: "Direct Connect TGW prefixes updated", detail: "" },
        { id: "check-connectivity", label: "On-premises return connectivity tested", detail: "" },
      ],
    }),
  ],
};
