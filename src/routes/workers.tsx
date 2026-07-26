import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/workers")({
  component: WorkersLayout,
});

function WorkersLayout() {
  return <Outlet />;
}
