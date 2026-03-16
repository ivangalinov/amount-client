import type { Operation } from "@/entities/operation/model/types";
import type { Category } from "@/entities/category/model/types";
import type { CategoryId } from "@/entities/category/model/types";
import type { DashboardStats, CategoryStatItem, DayStatItem, MonthStatItem } from "@/entities/stats/model/types";
import type { StatsApi, DashboardStatsParams } from "@/entities/stats/api/types";
import { keyValueStorage } from "@/shared/api/local-storage";

const OPERATIONS_KEY = "amount:operations";
const CATEGORIES_KEY = "amount:categories";

async function readOperations(): Promise<Operation[]> {
  const raw = await keyValueStorage.getItem(OPERATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Operation[];
  } catch {
    return [];
  }
}

async function readCategories(): Promise<Category[]> {
  const raw = await keyValueStorage.getItem(CATEGORIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Category[];
  } catch {
    return [];
  }
}

function buildCategoriesById(categories: Category[]): Map<CategoryId, Category> {
  return new Map(categories.map((c) => [c.id, c]));
}

export const statsLocalStorageApi: StatsApi = {
  async getDashboardStats(params: DashboardStatsParams): Promise<DashboardStats> {
    const [operations, categories] = await Promise.all([
      readOperations(),
      readCategories(),
    ]);

    const categoriesById = buildCategoriesById(categories);

    const filtered = operations.filter((o) => {
      if (o.workspaceId !== params.workspaceId) return false;
      if (params.dateFrom && o.createdAt < params.dateFrom) return false;
      if (params.dateTo && o.createdAt > params.dateTo) return false;
      return true;
    });

    let balance = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    const expensesByCategoryMap = new Map<CategoryId, number>();
    const incomeByCategoryMap = new Map<CategoryId, number>();
    const expensesByDayMap = new Map<string, number>();
    const expensesByMonthMap = new Map<string, number>();

    for (const op of filtered) {
      balance += op.amount;
      if (op.amount > 0) {
        totalIncome += op.amount;
        incomeByCategoryMap.set(
          op.categoryId,
          (incomeByCategoryMap.get(op.categoryId) ?? 0) + op.amount
        );
      } else {
        totalExpense += op.amount;
        expensesByCategoryMap.set(
          op.categoryId,
          (expensesByCategoryMap.get(op.categoryId) ?? 0) + op.amount
        );
        const day = op.createdAt.slice(0, 10);
        expensesByDayMap.set(day, (expensesByDayMap.get(day) ?? 0) + op.amount);
        const month = op.createdAt.slice(0, 7);
        expensesByMonthMap.set(
          month,
          (expensesByMonthMap.get(month) ?? 0) + op.amount
        );
      }
    }

    const expensesByCategory: CategoryStatItem[] = Array.from(
      expensesByCategoryMap.entries()
    )
      .map(([categoryId, sum]) => ({
        categoryId,
        name: categoriesById.get(categoryId)?.name ?? "—",
        color: categoriesById.get(categoryId)?.color ?? "#888",
        sum,
      }))
      .sort((a, b) => a.sum - b.sum);

    const incomeByCategory: CategoryStatItem[] = Array.from(
      incomeByCategoryMap.entries()
    )
      .map(([categoryId, sum]) => ({
        categoryId,
        name: categoriesById.get(categoryId)?.name ?? "—",
        color: categoriesById.get(categoryId)?.color ?? "#888",
        sum,
      }))
      .sort((a, b) => b.sum - a.sum);

    const expensesByDay: DayStatItem[] = Array.from(expensesByDayMap.entries())
      .map(([day, sum]) => ({ day, sum }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const expensesByMonth: MonthStatItem[] = Array.from(
      expensesByMonthMap.entries()
    )
      .map(([month, sum]) => ({ month, sum }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      balance,
      totalIncome,
      totalExpense,
      expensesByCategory,
      incomeByCategory,
      expensesByDay,
      expensesByMonth,
    };
  },
};
