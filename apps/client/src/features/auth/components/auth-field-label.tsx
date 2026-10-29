import { Label } from "@/components/ui/label";

type AuthFieldLabelProps = {
  htmlFor: string;
  label: string;
  error?: string;
  errorId?: string;
};

export function AuthFieldLabel({ htmlFor, label, error, errorId }: AuthFieldLabelProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {error ? (
        <>
          <span aria-hidden className="text-muted-foreground">
            –
          </span>
          <span id={errorId} role="alert" className="text-sm font-normal text-destructive">
            {error}
          </span>
        </>
      ) : null}
    </div>
  );
}
