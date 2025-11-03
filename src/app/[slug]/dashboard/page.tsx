import TwitchChannelComponent from "@/components/TwitchChannelComponent";
import Link from "next/link";
import { Suspense } from "react";

type DashboardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;

  return (
    <div className="flex flex-col gap-6 p-6">
      <Suspense fallback={''}>
        <TwitchChannelComponent slug={slug} />
      </Suspense>
    </div>
  );
}
