import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/teachers/news")({ component: () => <Outlet /> });
