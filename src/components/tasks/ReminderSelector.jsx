import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";

const reminderOptions = [
  { type: "on_due_date", label: "On due date" },
  { type: "1_day_before", label: "1 day before" },
  { type: "3_days_before", label: "3 days before" },
  { type: "1_week_before", label: "1 week before" },
];

export default function ReminderSelector({ reminders, onChange, dueDate }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState(null);

  const toggleReminder = (type) => {
    const exists = reminders.find(r => r.type === type);
    if (exists) {
      onChange(reminders.filter(r => r.type !== type));
    } else {
      onChange([...reminders, { type, sent: false }]);
    }
  };

  const addCustomReminder = () => {
    if (customDate) {
      onChange([
        ...reminders,
        { type: "custom", custom_date: customDate.toISOString().split('T')[0], sent: false }
      ]);
      setCustomDate(null);
      setShowCustom(false);
    }
  };

  const removeCustomReminder = (index) => {
    onChange(reminders.filter((_, i) => i !== index));
  };

  const customReminders = reminders.filter(r => r.type === "custom");

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Bell className="w-4 h-4" />
        Reminders
      </Label>
      
      {!dueDate ? (
        <p className="text-xs text-slate-500">Set a due date to enable reminders</p>
      ) : (
        <>
          <div className="space-y-2">
            {reminderOptions.map((option) => (
              <div key={option.type} className="flex items-center gap-2">
                <Checkbox
                  id={option.type}
                  checked={reminders.some(r => r.type === option.type)}
                  onCheckedChange={() => toggleReminder(option.type)}
                />
                <label htmlFor={option.type} className="text-sm cursor-pointer">
                  {option.label}
                </label>
              </div>
            ))}
          </div>

          {customReminders.length > 0 && (
            <div className="space-y-1">
              {customReminders.map((reminder, index) => (
                <div key={index} className="flex items-center gap-2 text-sm bg-slate-50 px-2 py-1 rounded">
                  <CalendarIcon className="w-3 h-3 text-slate-500" />
                  <span>{format(new Date(reminder.custom_date), "MMM d, yyyy")}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomReminder(reminders.indexOf(reminder))}
                    className="ml-auto text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showCustom ? (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <CalendarIcon className="w-3 h-3 mr-2" />
                    {customDate ? format(customDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={setCustomDate}
                  />
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={addCustomReminder} disabled={!customDate}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCustom(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustom(true)}
              className="w-full"
            >
              <Plus className="w-3 h-3 mr-2" />
              Add custom reminder
            </Button>
          )}
        </>
      )}
    </div>
  );
}