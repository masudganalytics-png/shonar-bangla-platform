import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/community/mosques")({
  component: () => <Outlet />,
});
