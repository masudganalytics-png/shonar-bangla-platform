import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="flex flex-col items-center gap-4 p-10 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)]">
          <Icon className="h-7 w-7" />
        </div>
        <Badge variant="secondary">শীঘ্রই আসছে</Badge>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>
      </Card>
    </div>
  );
}
