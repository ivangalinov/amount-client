"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  getMonthStart,
  getMonthEnd,
  getToday,
  formatDateRange,
} from "@/shared/lib/date";

export interface DateRangeFilterProps {
  /** Начальная дата периода (YYYY-MM-DD) */
  dateFrom: string;
  /** Конечная дата периода (YYYY-MM-DD) */
  dateTo: string;
  /** Вызывается при изменении периода */
  onPeriodChange: (dateFrom: string, dateTo: string) => void;
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onPeriodChange,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSetCurrentMonth = () => {
    const d = new Date();
    onPeriodChange(getMonthStart(d), getToday());
  };

  const handleSetLastMonth = () => {
    const d = new Date();
    const lastMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    onPeriodChange(getMonthStart(lastMonth), getMonthEnd(lastMonth));
  };

  const handleSetLast30Days = () => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    onPeriodChange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  };

  return (
    <Popover
      placement="bottom-end"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      showArrow
    >
      <PopoverTrigger>
        <Button
          variant="flat"
          size="sm"
          className="min-w-[200px] justify-start font-normal text-default-600"
        >
          {formatDateRange(dateFrom, dateTo)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              label="С"
              value={dateFrom}
              onValueChange={(value) => onPeriodChange(value, dateTo)}
              size="sm"
              classNames={{ base: "max-w-[140px]" }}
            />
            <Input
              type="date"
              label="По"
              value={dateTo}
              onValueChange={(value) => onPeriodChange(dateFrom, value)}
              size="sm"
              classNames={{ base: "max-w-[140px]" }}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="flat" onPress={handleSetCurrentMonth}>
              Этот месяц
            </Button>
            <Button size="sm" variant="flat" onPress={handleSetLastMonth}>
              Прошлый месяц
            </Button>
            <Button size="sm" variant="flat" onPress={handleSetLast30Days}>
              30 дней
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
