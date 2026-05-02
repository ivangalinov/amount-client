import { FileManager } from "@/shared/file"
import { Button } from "@heroui/button"
import APIClient from '@/entities/operation/api/remote';
import { useCallback } from "react";

const fileManager = new FileManager();
const apiClient = new APIClient();

function useImport() {
    return useCallback(async () => {
        const files = await fileManager.select();
        const file = files[0];
        apiClient.batchImport(file);
    }, []);
}

export default function ActionImport() {
    const onImport = useImport();
    return (
        <Button 
            color="primary"
            onPress={onImport}>
            Импорт
        </Button>
    )
}
