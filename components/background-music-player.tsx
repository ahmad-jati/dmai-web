'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MusicNotesIcon, PlayIcon, StopIcon } from "@phosphor-icons/react"
import { Button } from "./ui/button";

export function BackgroundMusicPlayer(){
  return(
    <div className="bg-background flex items-center gap-2 justify-between w-100 px-4 py-2 rounded-xl border border-foreground">
      <MusicNotesIcon className="w-4 h-4"/>

      <div className="flex-1 text-sm flex flex-col gap-0.5 items-center">
        <p className="font-semibold">Air on the G String</p>
        <p className="">J. S. Bach</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="w-5.5 h-5.5 p-1 [&_svg]:size-3 flex items-center justify-center rotate-90 bg-white"
          >
            <PlayIcon className="w-5 h-5" weight="fill"/>  
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-74 bg-background">
          <DropdownMenuItem  className="py-0.5 px-1">
            <Button variant="ghost" size="lg" className="rounded-sm p-2 flex-1 flex flex-col gap-0.5 items-start text-sm">
              <p className="font-bold">Air on the G String</p>
              <p className="">J. S. Bach</p>
            </Button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem  className="py-0.5 px-1">
            <Button variant="ghost" size="lg" className="rounded-sm p-2 flex-1 flex flex-col gap-0.5 items-start text-sm">
              <p className="font-bold">Air on the G String</p>
              <p className="">J. S. Bach</p>
            </Button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem  className="py-0.5 px-1">
            <Button variant="ghost" size="lg" className="rounded-sm p-2 flex-1 flex flex-col gap-0.5 items-start text-sm">
              <p className="font-bold">Air on the G String</p>
              <p className="">J. S. Bach</p>
            </Button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem  className="py-0.5 px-1">
            <Button variant="ghost" size="lg" className="rounded-sm p-2 flex-1 flex flex-col gap-0.5 items-start text-sm">
              <p className="font-bold">Air on the G String</p>
              <p className="">J. S. Bach</p>
            </Button>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex-col gap-2">
            <Button className="flex-1 flex gap-2 items-center text-sm rounded-full p-2 bg-white hover:bg-white/80 w-full">
              <StopIcon className=" w-5 h-5" weight="fill"/>
              <p className="font-medium">Matikan Lagu</p>
            </Button>

          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}