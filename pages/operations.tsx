import DefaultLayout from "@/layouts/default";
import { OperationList } from "@/features/operation-list";

export default function OperationsPage() {
  return (
    <DefaultLayout>
      <OperationList />
    </DefaultLayout>
  );
}
