"use client";

import { TiptapCollabProvider } from "@hocuspocus/provider";
import "iframe-resizer/js/iframeResizer.contentWindow";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Doc as YDoc } from "yjs";

import { BlockEditor } from "@/components/BlockEditor";
import { createPortal } from "react-dom";
import { Surface } from "@/components/ui/Surface";
import { Toolbar } from "@/components/ui/Toolbar";
import { Icon } from "@/components/ui/Icon";
import { EvoluProvider } from "@evolu/react";
import { evolu } from "@/db/db";
import { useTheme } from "next-themes";

export default function Document({ params }: { params: { room: string } }) {
  const { theme, setTheme } = useTheme();
  const [provider, setProvider] = useState<TiptapCollabProvider | null>(null);
  const [collabToken, setCollabToken] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const hasCollab = parseInt(searchParams.get("noCollab") as string) !== 1;

  const { room } = params;

  const ydoc = useMemo(() => new YDoc(), []);

  useLayoutEffect(() => {
    if (hasCollab && collabToken) {
      setProvider(
        new TiptapCollabProvider({
          name: `${process.env.NEXT_PUBLIC_COLLAB_DOC_PREFIX}${room}`,
          appId: process.env.NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID ?? "",
          token: collabToken,
          document: ydoc,
        }),
      );
    }
  }, [setProvider, collabToken, ydoc, room, hasCollab]);

  // if (hasCollab && (!collabToken || !provider)) return;

  const DarkModeSwitcher = createPortal(
    <Surface className="flex items-center gap-1 fixed bottom-6 right-6 z-[99999] p-1">
      <Toolbar.Button
        onClick={() => setTheme("light")}
        active={theme === "light"}
      >
        <Icon name="Sun" />
      </Toolbar.Button>
      <Toolbar.Button
        onClick={() => setTheme("dark")}
        active={theme === "dark"}
      >
        <Icon name="Moon" />
      </Toolbar.Button>
    </Surface>,
    document.body,
  );

  return (
    <EvoluProvider value={evolu}>
      {DarkModeSwitcher}
      <BlockEditor hasCollab={hasCollab} ydoc={ydoc} provider={provider} />
    </EvoluProvider>
  );
}
