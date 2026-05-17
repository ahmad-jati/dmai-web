'use client'
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/components/layout/section-wrapper";
import { Button } from "@/components/ui/button";
import { OtherSessionList } from "@/components/other-session-list";
import { data_session } from "@/lib/data-detail-session";

import { PersonSimpleTaiChiIcon, TimerIcon, PlayIcon, HeartIcon } from "@phosphor-icons/react";
import { Route } from "next";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default function Page({ params }: Props) {
  const { slug } = use(params);
  const session = data_session.find((s) => toSlug(s.session_name) === slug);

  if (!session) notFound();

  return (
    <div className="flex flex-col gap-8 w-full">
      <Section className="flex gap-8 bg-celeste">
        <div className="flex flex-col justify-between max-w-xl">
          <div className="flex items-center gap-1 font-semibold text-sm">
            <Link href={"/session" as Route}>ALL SESSION</Link>
            <p>/</p>
            <p>{session.session_name.toUpperCase()}</p>
          </div>

          <div className="flex flex-col gap-4">
            <h1>{session.session_name.toUpperCase()}</h1>

            {session.detail_full.map((para, i) => (
              <p key={i} className="font-medium text-base">{para}</p>
            ))}

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <PersonSimpleTaiChiIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium text-sm">{session.total_instruction} Instruksi</p>
              </div>
              <div className="flex items-center gap-1">
                <TimerIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium text-sm">{session.duration}</p>
              </div>
              <div className="flex items-center gap-1">
                <HeartIcon className="w-5 h-5" weight="fill" />
                <p className="font-medium text-sm">Kamu telah mengikuti sesi ini 3 kali</p>
              </div>
            </div>
          </div>

          <Button className="w-fit [&_svg]:size-3">
            <Link href={`/session/${slug}/exercise` as Route} className="flex items-center gap-2">
              MULAI SESI
              <PlayIcon className="w-5 h-5" weight="fill" />
            </Link>
          </Button>
        </div>

        <div className="flex-1 rounded-5xl border border-foreground bg-background p-2 h-88">
          <Image
            src={session.instructions[0]?.image ?? '/serene1.png'}
            alt={session.session_name}
            width={2000}
            height={2000}
            className="w-full h-full object-cover rounded-4xl"
            loading="eager"
          />
        </div>
      </Section>

      <Section className="bg-pink">
        <OtherSessionList excludeSlug={slug} />
      </Section>
    </div>
  );
}