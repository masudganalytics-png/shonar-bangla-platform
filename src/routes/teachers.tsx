import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teachers")({
  component: TeachersLayout,
});

function TeachersLayout() {
  return <Outlet />;
}
