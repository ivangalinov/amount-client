import type { CategoryId } from "@/entities/category/model/types";

export interface ICategoryStatItem {
  categoryId: CategoryId;
  name: string;
  color: string;
  sum: number;
}

export interface IDayStatItem {
  day: string;
  sum: number;
}

export interface IMonthStatItem {
  month: string;
  sum: number;
}

export interface IDashboardStats {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  expensesByCategory: ICategoryStatItem[];
  incomeByCategory: ICategoryStatItem[];
  expensesByDay: IDayStatItem[];
  expensesByMonth: IMonthStatItem[];
}
