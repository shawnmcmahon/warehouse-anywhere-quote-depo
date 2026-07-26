import { ButtonLink } from "../ui/Button";

export default function NotFound() {
  return (
    <div className="bp-grid flex min-h-screen flex-col items-center justify-center gap-6 bg-bp-vellum px-5 py-16 text-bp-ink">
      <p className="bp-anno m-0 text-[10px] text-bp-line">Sheet not found</p>
      <h1 className="bp-display m-0 text-center text-[clamp(2.5rem,8vw,5rem)]">
        Nothing drawn here
      </h1>
      <p className="bp-body m-0 max-w-[46ch] text-center text-sm text-bp-graphite">
        This address does not match a page. If you followed a bid link, check
        it against the one you were sent.
      </p>
      <ButtonLink to="/" variant="primary" size="lg">
        Back to the start
      </ButtonLink>
    </div>
  );
}
