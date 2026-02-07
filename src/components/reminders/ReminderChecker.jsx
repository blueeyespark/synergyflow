import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { format, subDays, isToday, isSameDay, parseISO } from "date-fns";

export default function ReminderChecker({ tasks, projectName, user }) {
  const checkedRef = useRef(new Set());

  useEffect(() => {
    if (!tasks || !user) return;

    const checkReminders = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const task of tasks) {
        if (!task.reminders || task.reminders.length === 0 || !task.due_date || task.status === 'completed') {
          continue;
        }

        const dueDate = parseISO(task.due_date);
        const assignee = task.assigned_to || task.created_by;

        for (let i = 0; i < task.reminders.length; i++) {
          const reminder = task.reminders[i];
          
          if (reminder.sent) continue;

          const reminderKey = `${task.id}-${reminder.type}-${reminder.custom_date || ''}`;
          if (checkedRef.current.has(reminderKey)) continue;

          let shouldTrigger = false;
          let reminderDate = null;

          switch (reminder.type) {
            case "on_due_date":
              shouldTrigger = isToday(dueDate);
              reminderDate = dueDate;
              break;
            case "1_day_before":
              reminderDate = subDays(dueDate, 1);
              shouldTrigger = isToday(reminderDate);
              break;
            case "3_days_before":
              reminderDate = subDays(dueDate, 3);
              shouldTrigger = isToday(reminderDate);
              break;
            case "1_week_before":
              reminderDate = subDays(dueDate, 7);
              shouldTrigger = isToday(reminderDate);
              break;
            case "custom":
              if (reminder.custom_date) {
                reminderDate = parseISO(reminder.custom_date);
                shouldTrigger = isToday(reminderDate);
              }
              break;
          }

          if (shouldTrigger && assignee) {
            checkedRef.current.add(reminderKey);
            
            try {
              // Create notification
              await base44.entities.Notification.create({
                user_email: assignee,
                type: "deadline_approaching",
                title: `Reminder: ${task.title}`,
                message: reminder.type === "on_due_date" 
                  ? `Task "${task.title}" is due today!`
                  : `Task "${task.title}" is due on ${format(dueDate, "MMM d, yyyy")}`,
                project_id: task.project_id,
                task_id: task.id
              });

              // Mark reminder as sent
              const updatedReminders = [...task.reminders];
              updatedReminders[i] = { ...reminder, sent: true };
              
              await base44.entities.Task.update(task.id, {
                reminders: updatedReminders
              });
            } catch (error) {
              console.error("Failed to create reminder notification:", error);
            }
          }
        }
      }
    };

    checkReminders();
  }, [tasks, user, projectName]);

  return null;
}