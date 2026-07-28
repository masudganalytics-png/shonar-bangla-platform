import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/blood-donors")({
  component: () => <Outlet />,
});
