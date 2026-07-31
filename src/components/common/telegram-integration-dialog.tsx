"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from "../ui/dialog";
import { createTelegramLinkAction } from "@/actions/telegram/create-link";
import { Button } from "@/components/ui/button";

export const TelegramIntegrationDialog = () => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [webFallbackUrl, setWebFallbackUrl] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const telegramSubmitIntegration = () => {
    setErrorMessage(undefined);
    setWebFallbackUrl(undefined);

    startTransition(async () => {
      try {
        const result = await createTelegramLinkAction();

        if (!result?.data?.ok) {
          setErrorMessage(
            result?.data?.message ??
              "Não foi possível iniciar a integração com o Telegram.",
          );
          return;
        }

        setWebFallbackUrl(result.data.webUrl);
        window.location.assign(result.data.appUrl);
      } catch {
        setErrorMessage(
          "Não foi possível iniciar a integração com o Telegram. Tente novamente.",
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost">Telegram</Button>}
      ></DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl">Integrar com Telegram</DialogTitle>
            <DialogDescription className="text-sm">
              Clique no botão abaixo para iniciar a integração do Telegram com o
              WallAI. Você será redirecionado para o Telegram para autorizar a
              integração.
            </DialogDescription>
          </DialogHeader>
          {errorMessage ? (
            <p
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          {webFallbackUrl ? (
            <Button
              className="w-full"
              variant="outline"
              render={
                <a
                  href={webFallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Abrir no Telegram Web
            </Button>
          ) : null}
          <DialogFooter>
            <Button
              className="w-full"
              type="button"
              disabled={isPending}
              onClick={telegramSubmitIntegration}
            >
              {isPending ? "Abrindo Telegram..." : "Integrar com Telegram"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
