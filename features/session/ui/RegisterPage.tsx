"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import NextLink from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import { useRootStore } from "@/shared/store/root-store";

export const RegisterPage = observer(function RegisterPage() {
  const { user } = useRootStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError("Пароль не короче 8 символов");
      return;
    }
    setSubmitting(true);
    try {
      await user.register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
    } catch {
      setFormError(user.error ?? "Не удалось зарегистрироваться");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-default-100 via-background to-default-200 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-semibold">Регистрация</h1>
          <p className="text-sm text-default-500">
            Создайте аккаунт — будет создано личное рабочее пространство
          </p>
        </CardHeader>
        <CardBody className="gap-4 px-6 pb-6">
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Input
              label="Имя"
              type="text"
              autoComplete="name"
              value={name}
              onValueChange={setName}
              description="Необязательно"
              variant="bordered"
            />
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
              autoComplete="new-password"
              value={password}
              onValueChange={setPassword}
              isRequired
              description="Минимум 8 символов"
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
              Зарегистрироваться
            </Button>
          </form>
          <p className="text-center text-sm text-default-500">
            Уже есть аккаунт?{" "}
            <NextLink href="/login" className="text-primary font-medium">
              Войти
            </NextLink>
          </p>
        </CardBody>
      </Card>
    </div>
  );
});
