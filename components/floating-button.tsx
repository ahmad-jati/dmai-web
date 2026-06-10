'use client'

import { Button } from "./ui/button";
import { ArrowUpIcon } from "@phosphor-icons/react";

export function FloatingButton(){
  return(
    <div className="fixed bottom-2.5 right-10 z-140">
      <Button 
        className="relative rounded-full p-2"
        onClick={() => {
          document.getElementById("navbar-app")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <ArrowUpIcon/>
      </Button>
    </div>
  )
}