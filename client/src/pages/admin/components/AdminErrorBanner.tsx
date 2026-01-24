import { Card, CardContent } from "@/components/ui/card";

export default function AdminErrorBanner({ title, message }: { title: string; message?: string }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="py-4">
        <div className="font-medium text-destructive">{title}</div>
        {message ? <div className="text-sm text-muted-foreground mt-1">{message}</div> : null}
      </CardContent>
    </Card>
  );
}
