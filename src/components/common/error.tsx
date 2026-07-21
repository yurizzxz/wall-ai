"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CategoriesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ reset }: CategoriesErrorProps) {
  return (
    <div className="mx-auto flex w-full py-6 sm:py-8">
      <Card className="w-full">
        <CardHeader>
          <span className="mb-2 flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <CircleAlert className="size-4" aria-hidden="true" />
          </span>
          <CardTitle>Não foi possível carregar seu dados</CardTitle>
          <CardDescription>
            Seus dados continuam seguros. Tente carregar esta área novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
