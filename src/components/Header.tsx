"use client";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { BookList } from "./BookList";
import { AudioPlayer } from "./AudioPlayer";
import { AudioPlayerCanvas } from "./AudioPlayerCanvas";

export const Header = () => {
  return (
    <>
      <div className="full flex items-center justify-between p-3">
        <div className="font-bold">老人FM</div>
        <BookList />
      </div>
      <div>
        <AudioPlayer audio="http://localhost:3000/file.m3u8" />
        <AudioPlayerCanvas audio="http://localhost:3000/file.m3u8" />
      </div>
    </>
  );
};
