"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Tags, Utensils, BriefcaseBusiness, Edit2, Trash2, X, Check } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useFinance } from "@/context/FinanceContext";
import type { Category, TransactionType } from "@/types/transaction";
import { formatEGP } from "@/lib/finance";

const palette = [
  "#F59E0B",
  "#38BDF8",
  "#C084FC",
  "#FB7185",
  "#34D399",
  "#94A3B8",
  "#60A5FA",
  "#F43F5E",
  "#10B981",
  "#8B5CF6",
];

export default function CategoriesPage() {
  const { categories, addCategory, editCategory, deleteCategory } = useFinance();

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState(palette[0]);
  const [budget, setBudget] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; error?: boolean } | null>(
    null
  );

  function startEdit(cat: Category) {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
    setBudget(cat.budget ? String(cat.budget) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingCategory(null);
    setName("");
    setType("expense");
    setColor(palette[0]);
    setBudget("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    const parsedBudget = budget ? Number(budget) : undefined;

    if (editingCategory) {
      editCategory(editingCategory.id, {
        name: name.trim(),
        type,
        color,
        budget: type === "expense" && parsedBudget && parsedBudget > 0 ? parsedBudget : undefined,
      });
      setFeedbackMessage({ text: "تم تحديث التصنيف بنجاح!" });
      cancelEdit();
    } else {
      addCategory({
        name: name.trim(),
        type,
        color,
        icon: type === "income" ? "briefcase" : "tag",
        budget: type === "expense" && parsedBudget && parsedBudget > 0 ? parsedBudget : undefined,
      });
      setFeedbackMessage({ text: "تمت إضافة التصنيف بنجاح!" });
      setName("");
      setBudget("");
    }

    setTimeout(() => setFeedbackMessage(null), 3000);
  }

  async function handleDelete(cat: Category) {
    if (window.confirm(`هل أنت متأكد من حذف تصنيف "${cat.name}"؟`)) {
      const res = await deleteCategory(cat.id);
      if (!res.success) {
        alert(res.message || "تعذر حذف هذا التصنيف");
      } else {
        setFeedbackMessage({ text: `تم حذف تصنيف "${cat.name}" بنجاح.` });
        if (editingCategory?.id === cat.id) cancelEdit();
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }
  }

  return (
    <AppShell
      title="التصنيفات والميزانية"
      subtitle="تنظيم حركات الأموال وتحديد سقف المصروفات لكل فئة"
    >
      <div className="mb-7">
        <p className="text-xs font-semibold tracking-wider text-emerald-700">هيكلة المصروفات</p>
        <h2 className="mt-1.5 text-2xl font-bold text-[#0f1712]">التصنيفات وسقف الإنفاق</h2>
        <p className="mt-1 text-xs text-[#607267]">
          قسّم أموالك إلى بنود واضحة وحدد ميزانية شهرية لكل بند لضبط الاستهلاك.
        </p>
      </div>

      {feedbackMessage && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border p-3.5 text-xs font-medium ${
            feedbackMessage.error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <Check size={16} />
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Categories Lists */}
        <div className="grid content-start gap-6 md:grid-cols-2">
          {(["expense", "income"] as const).map((kind) => {
            const list = categories.filter((c) => c.type === kind);
            const isIncome = kind === "income";

            return (
              <section
                key={kind}
                className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-xs"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl border ${
                      isIncome
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : "border-amber-100 bg-amber-50 text-amber-600"
                    }`}
                  >
                    {isIncome ? <BriefcaseBusiness size={17} /> : <Utensils size={17} />}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#0f1712]">
                      {isIncome ? "تصنيفات الدخل" : "تصنيفات المصروفات"}
                    </h3>
                    <p className="text-[11px] text-[#607267]">{list.length} تصنيفات نشطة</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {list.map((category) => (
                    <div
                      key={category.id}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-[#e2e8e5] bg-[#f8faf9] px-3.5 py-3 transition hover:border-emerald-300 hover:bg-white"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ background: category.color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#0f1712]">
                            {category.name}
                          </p>
                          {category.budget && category.budget > 0 && (
                            <p className="mt-0.5 text-[11px] text-[#607267]">
                              الميزانية: {formatEGP(category.budget)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-90">
                        <button
                          title="تعديل التصنيف"
                          onClick={() => startEdit(category)}
                          className="rounded-lg p-1.5 text-[#8c9c91] transition hover:bg-[#f1f5f3] hover:text-[#0f1712]"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          title="حذف التصنيف"
                          onClick={() => handleDelete(category)}
                          className="rounded-lg p-1.5 text-[#8c9c91] transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {list.length === 0 && (
                    <p className="py-6 text-center text-xs text-[#8c9c91]">لا توجد تصنيفات بعد.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Add/Edit Form */}
        <form
          onSubmit={submit}
          className="h-fit rounded-2xl border border-[#e5eae7] bg-white p-5 sm:p-6 shadow-xs"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ecfdf5] text-[#059669]">
                <Tags size={17} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#0f1712]">
                  {editingCategory ? "تعديل التصنيف" : "إنشاء تصنيف جديد"}
                </h3>
                <p className="text-[11px] text-[#607267]">
                  {editingCategory
                    ? `تعديل بيانات: ${editingCategory.name}`
                    : "إضافة بند تصنيف جديد"}
                </p>
              </div>
            </div>
            {editingCategory && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-1 rounded-lg border border-[#e2e8e5] px-2 py-1 text-[11px] text-[#607267] hover:bg-[#f3f6f4]"
              >
                <X size={13} /> إلغاء
              </button>
            )}
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">اسم التصنيف</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="مثلاً: قهوة وكافيهات، كورسات تعليمية"
              className="field"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium text-[#526359]">نوع التصنيف</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expense")}
              className="field"
            >
              <option value="expense">مصروف (يخصم من الرصيد)</option>
              <option value="income">دخل (يضاف إلى الرصيد)</option>
            </select>
          </label>

          {type === "expense" && (
            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-medium text-[#526359]">
                سقف الميزانية الشهرية (ج.م) <span className="text-[#8c9c91]">(اختياري)</span>
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="مثلاً: 3000"
                className="field"
              />
              <span className="mt-1 block text-[10px] text-[#8c9c91]">
                سيتم تنبيهك عند اقتراب المصروفات من هذا السقف خلال الشهر.
              </span>
            </label>
          )}

          <div className="mb-6">
            <span className="mb-2 block text-xs font-medium text-[#526359]">لون التصنيف</span>
            <div className="flex flex-wrap gap-2">
              {palette.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setColor(item)}
                  aria-label={`اختيار اللون ${item}`}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === item
                      ? "scale-110 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white"
                      : "hover:scale-105"
                  }`}
                  style={{ background: item }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
          >
            <Plus size={15} />
            {editingCategory ? "حفظ تعديل التصنيف" : "إضافة التصنيف"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
