"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import { useRootStore } from "@/shared/store/root-store";

export const LoginPage = observer(function LoginPage() {
  const { user } = useRootStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await user.login(email.trim(), password);
    } catch {
      setFormError(user.error ?? "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-default-100 via-background to-default-200 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-semibold">Вход</h1>
          <p className="text-sm text-default-500">
            Войдите, чтобы вести учёт доходов и расходов
          </p>
        </CardHeader>
        <CardBody className="gap-4 px-6 pb-6">
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onValueChange={setEmail}
              isRequired
              variant="bordered"
            />
            <Input
              label="Пароль"
              type="password"
              autoComplete="current-password"
              value={password}
              onValueChange={setPassword}
              isRequired
              variant="bordered"
            />
            {formError ? (
              <p className="text-sm text-danger">{formError}</p>
            ) : null}
            <Button
              color="primary"
              type="submit"
              isLoading={submitting}
              className="w-full"
            >
              Войти
            </Button>
          </form>
          <p className="text-center text-sm text-default-500">
            Нет аккаунта?{" "}
            <NextLink href="/register" className="text-primary font-medium">
              Регистрация
            </NextLink>
          </p>
        </CardBody>
      </Card>
    </div>
  );
});
