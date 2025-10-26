import Link from "next/link";

type DashboardPageProps = {
  params: { slug: string };
};

export default function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = params;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold capitalize">{slug} dashboard</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Manage your Twitch bot configuration and streaming tools from this page.
        </p>
      </div>

      <Link
        href="/auth/twitch/bot-login"
        className="inline-flex w-fit items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg3)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg2)]"
      >
        Connect Bot
      </Link>
    </div>
  );
}
