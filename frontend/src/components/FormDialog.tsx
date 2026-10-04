import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { ZodTypeAny } from "zod";
import { Button, Dialog, useToast } from "@/components/ui";
import { ApiError } from "@/lib/api";

interface Props {
  open: boolean; onClose: () => void; title: string; schema: ZodTypeAny; defaultValues: FieldValues;
  onSubmit: (values: FieldValues) => Promise<unknown>; submitLabel?: string; successMessage: string; wide?: boolean;
  children: (form: UseFormReturn<FieldValues>) => ReactNode;
}

/** Dialog + React Hook Form + Zod. Shows server-side validation errors next to the fields they belong to. */
export function FormDialog({ open, onClose, title, wide, ...rest }: Props) {
  return <Dialog open={open} onClose={onClose} title={title} wide={wide}><FormBody onClose={onClose} {...rest} /></Dialog>;
}

function FormBody({ onClose, schema, defaultValues, onSubmit, submitLabel = "Save changes", successMessage, children }: Omit<Props, "open" | "title" | "wide">) {
  const form = useForm<FieldValues>({ resolver: zodResolver(schema), defaultValues });
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useToast();

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
      toast("success", successMessage);
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        setFormError(e.message);
        for (const fe of e.fieldErrors) {
          const name = String(fe.loc[fe.loc.length - 1]);
          if (name in values) form.setError(name, { message: fe.msg });
        }
      } else setFormError("Something went wrong. Please try again.");
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {children(form)}
      {formError && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={form.formState.isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
