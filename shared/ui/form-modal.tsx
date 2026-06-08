"use client";

import { Modal, type ModalProps } from "@heroui/modal";
import clsx from "clsx";

export const FORM_MODAL_BODY_CLASS = "gap-4";

const FORM_MODAL_CLASS_NAMES: ModalProps["classNames"] = {
  wrapper: "items-end sm:items-center",
  base: clsx(
    "max-h-[var(--visual-viewport-height)]",
    // Bottom sheet только на мобильных; на sm+ ширину задаёт prop size у Modal.
    "max-sm:m-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none",
  ),
  body: "overflow-y-auto",
};

type FormModalProps = Omit<ModalProps, "scrollBehavior" | "classNames"> & {
  classNames?: ModalProps["classNames"];
};

function FormModal({ classNames, ...props }: FormModalProps) {
  return (
    <Modal
      scrollBehavior="inside"
      classNames={{
        wrapper: clsx(FORM_MODAL_CLASS_NAMES?.wrapper, classNames?.wrapper),
        base: clsx(FORM_MODAL_CLASS_NAMES?.base, classNames?.base),
        body: clsx(FORM_MODAL_CLASS_NAMES?.body, classNames?.body),
        backdrop: classNames?.backdrop,
        header: classNames?.header,
        footer: classNames?.footer,
        closeButton: classNames?.closeButton,
      }}
      {...props}
    />
  );
}

export { FormModal };
