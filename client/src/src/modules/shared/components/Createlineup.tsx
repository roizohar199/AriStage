import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal.tsx";
import DesignActionButtonBig from "./DesignActionButtonBig";
import { DateInput, Input, Textarea, TimeInput } from "./FormControls";

interface CreateLineupForm {
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

interface CreateLineupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateLineupForm) => Promise<void>;
  initialForm?: Partial<CreateLineupForm>;
  editing?: boolean;
}

const CreateLineup: React.FC<CreateLineupProps> = ({
  open,
  onClose,
  onSubmit,
  initialForm,
  editing = false,
}) => {
  const [form, setForm] = useState<CreateLineupForm>({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  // עדכון ערכי טופס התחלתיים במצב עריכה
  useEffect(() => {
    if (open) {
      setForm({
        name: initialForm?.name ?? "",
        description: initialForm?.description ?? "",
        date: initialForm?.date ?? "",
        time: initialForm?.time ?? "",
        location: initialForm?.location ?? "",
      });
    } else {
      setForm({ name: "", description: "", date: "", time: "", location: "" });
    }
  }, [open, initialForm]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      date: form.date,
      time: form.time,
      location: form.location.trim(),
    });
    setForm({ name: "", description: "", date: "", time: "", location: "" });
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={editing ? "עריכת ליינאפ" : "צור ליינאפ חדש"}
      maxWidth="max-w-md"
    >
      <h2 className="text-xl font-bold mb-4 text-neutral-100">
        {editing ? "עריכת ליינאפ" : "צור ליינאפ חדש"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="שם הליינאפ *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <DateInput
          placeholder="dd/mm/yyyy"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <TimeInput
          placeholder="--:--"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />

        <Input
          placeholder="מיקום"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <Textarea
          placeholder="תיאור (אופציונלי)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />

        <DesignActionButtonBig type="submit">
          {editing ? "שמור" : "צור ליינאפ"}
        </DesignActionButtonBig>
      </form>
    </BaseModal>
  );
};

export default CreateLineup;
