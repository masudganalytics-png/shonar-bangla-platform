import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/teachers/tuitions")({ component: () => <Outlet /> });
