"use client";
import { WorkspaceDetail } from "@/components/ui/workspace-detail";
export function CompanyDetail({ id }: { id: string }) { return <WorkspaceDetail resource="companies" id={id} />; }
