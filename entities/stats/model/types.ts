import type { CategoryId } from "@/entities/category/model/types";

export interface CategoryStatItem {
  categoryId: CategoryId;
  name: string;
  color: string;
  sum: number;
}

export interface DayStatItem {
  day: string;
  sum: number;
}

export interface MonthStatItem {
  month: string;
  sum: number;
}

export interface DashboardStats {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  expensesByCategory: CategoryStatItem[];
  incomeByCategory: CategoryStatItem[];
  expensesByDay: DayStatItem[];
  expensesByMonth: MonthStatItem[];
}
