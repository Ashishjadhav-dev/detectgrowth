"use client";
import { WorkspaceDetail } from "@/components/ui/workspace-detail";
export function OpportunityDetail({ id }: { id: string }) { return <WorkspaceDetail resource="opportunities" id={id} />; }
