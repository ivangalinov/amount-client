"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Radio, RadioGroup } from "@heroui/radio";
import type {
  OperationImportSource,
} from "@/entities/operation/api/types";
import { FileManager } from "@/shared/file";
import { useRootStore } from "@/shared/store/root-store";

import StoreProvider from './StoreProvider';
import { useImportStore } from "../model/store";
import Preview from './Preview';

const fileManager = new FileManager();

interface ISettingsProps {
  onClose(): void;
  onExtractItems(): void;
}

const ActionSettings = observer((props: ISettingsProps) => {
  const store = useImportStore();
  const [source, setSource] = useState<OperationImportSource>("sber");
  const [file, setFile] = useState<File | null>(null);

  const selectFile = async () => {
    const files = await fileManager.select();
    if (!files.length) {
      return;
    }
    setFile(files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      return;
    }
    await store.parseFile(file, source);
    props.onExtractItems();
  };
  return (
    <>
      <ModalHeader>Импорт операций</ModalHeader>
      <ModalBody className="gap-4">
        {store.importError && (
          <p className="text-sm text-danger" role="alert">
            {store.importError}
          </p>
        )}
        <RadioGroup
          label="Источник"
          value={source}
          onValueChange={(value) => setSource(value as OperationImportSource)}
        >
          <Radio value="sber">Сбер</Radio>
          <Radio value="tinkoff">Тинькофф</Radio>
        </RadioGroup>

        <div className="flex items-center gap-3">
          <Button variant="flat" onPress={selectFile}>
            Выбрать файл
          </Button>
          <span className="text-sm text-default-500">
            {file?.name ?? "Файл не выбран"}
          </span>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={props.onClose}>
          Отмена
        </Button>
        <Button color="primary" isLoading={store.inProgress} onPress={handleImport}>
          Загрузить
        </Button>
      </ModalFooter>
    </>
  )
});

const ActionImport = observer(function ActionImport() {
  const { workspace, category: categoryStore } = useRootStore();
  const activeWorkspace = workspace.activeWorkspace;

  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) {
      return;
    }
    void categoryStore.loadCategories({ workspaceId: activeWorkspace.id });
  }, [activeWorkspace?.id, categoryStore]);



  const onExtractItems = async () => {
    setSourceModalOpen(false);
    setPreviewModalOpen(true);
  };

  return (
    <>
      <Button color="primary" onPress={() => setSourceModalOpen(true)}>
        Импорт
      </Button>

      <Modal
        isOpen={sourceModalOpen}
        onOpenChange={(open) => {
          setSourceModalOpen(open);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <ActionSettings onExtractItems={onExtractItems} onClose={onClose} />
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={previewModalOpen}
        size="5xl"
        onOpenChange={(open) => {
          setPreviewModalOpen(open);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <Preview onClose={onClose} />
          )}
        </ModalContent>
      </Modal>
    </>
  );
});


export default function _ActionImport() {
  return (
    <StoreProvider>
      <ActionImport />
    </StoreProvider>
  );
}
