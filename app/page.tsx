import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react";

export default function Home() {
  return (
    <main className="min-h-[calc(90svh-64px)] md:min-h-[calc(90dvh-52px)] bg-celeste">
      <div className="flex flex-col items-center gap-4">
        <Image 
          src={'/tropicaline/Being-Happy2.png'}
          alt=""
          width={2000}
          height={2000}
          className="w-132 h-100 object-cover"
        />

        <div className="flex-1 flex flex-col gap-3.5 items-center text-center text-foreground">
          <h1 className="text-h1 max-w-90">Digital Mindful Autogenic Intervention.</h1>
          <p className="text-lg max-w-160">
            Platform mindful yang dirancang untuk membantu kamu menjalani sesi latihan refleksi diri dengan suasana yang lebih tenang dan tidak terasa melelahkan.
          </p>
        </div>

        <Button
          variant={'default'}
        >COBA SEKARANG 
        <ArrowRightIcon className="w-4 h-4"/>
        </Button>
        <Button
          variant={'destructive'}
        >Tes</Button>
        <Button
          variant={'ghost'}
        >Tes</Button>
        <Button
          variant={'link'}
        >Tes</Button>
        <Button
          variant={'outline'}
        >Tes</Button>
        <Button
          variant={'secondary'}
        >Tes</Button>
      </div>
    </main>
  );
}
