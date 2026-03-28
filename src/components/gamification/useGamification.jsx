import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export const BADGES = [
  { id: 'first_task', name: 'First Step', description: 'Complete your first task', icon: '🎯', points: 50, condition: (s) => s.tasks_completed >= 1 },
  { id: 'task_10', name: 'Getting Things Done', description: 'Complete 10 tasks', icon: '✅', points: 100, condition: (s) => s.tasks_completed >= 10 },
  { id: 'task_50', name: 'Power User', description: 'Complete 50 tasks', icon: '⚡', points: 300, condition: (s) => s.tasks_completed >= 50 },
  { id: 'task_100', name: 'Legend', description: 'Complete 100 tasks', icon: '🏆', points: 500, condition: (s) => s.tasks_completed >= 100 },
  { id: 'streak_3', name: 'On a Roll', description: '3-day activity streak', icon: '🔥', points: 75, condition: (s) => s.streak_days >= 3 },
  { id: 'streak_7', name: 'Streak Master', description: '7-day activity streak', icon: '💥', points: 200, condition: (s) => s.streak_days >= 7 },
  { id: 'streak_30', name: 'Unstoppable', description: '30-day streak', icon: '🚀', points: 1000, condition: (s) => s.streak_days >= 30 },
  { id: 'comments_10', name: 'Team Player', description: 'Add 10 comments', icon: '💬', points: 100, condition: (s) => s.comments_added >= 10 },
  { id: 'creator_5', name: 'Project Builder', description: 'Create 5 tasks', icon: '🏗️', points: 75, condition: (s) => s.tasks_created >= 5 },
];

export const POINT_VALUES = {
  task_completed: 10,
  task_created: 3,
  comment_added: 2,
  streak_bonus: 5,
};

export async function awardPoints(userEmail, userName, action, workspaceId) {
  const points = POINT_VALUES[action] || 0;
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get or create stats
  const existing = await base44.entities.UserStats.filter({ user_email: userEmail });
  let stats = existing[0];

  if (!stats) {
    stats = await base44.entities.UserStats.create({
      user_email: userEmail,
      user_name: userName,
      total_points: 0,
      tasks_completed: 0,
      tasks_created: 0,
      comments_added: 0,
      streak_days: 0,
      badges: [],
      workspace_id: workspaceId,
      last_active_date: today
    });
  }

  const updates = {
    total_points: (stats.total_points || 0) + points,
    last_active_date: today,
    user_name: userName
  };

  // Update streak
  if (stats.last_active_date && stats.last_active_date !== today) {
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    if (stats.last_active_date === yesterday) {
      updates.streak_days = (stats.streak_days || 0) + 1;
      updates.total_points += POINT_VALUES.streak_bonus;
    } else {
      updates.streak_days = 1;
    }
  } else if (!stats.last_active_date) {
    updates.streak_days = 1;
  }

  // Increment specific counter
  if (action === 'task_completed') updates.tasks_completed = (stats.tasks_completed || 0) + 1;
  if (action === 'task_created') updates.tasks_created = (stats.tasks_created || 0) + 1;
  if (action === 'comment_added') updates.comments_added = (stats.comments_added || 0) + 1;

  // Check for new badges
  const updatedStats = { ...stats, ...updates };
  const existingBadgeIds = (stats.badges || []).map(b => b.id);
  const newBadges = BADGES.filter(b => 
    !existingBadgeIds.includes(b.id) && b.condition(updatedStats)
  );

  if (newBadges.length > 0) {
    updates.badges = [
      ...(stats.badges || []),
      ...newBadges.map(b => ({ id: b.id, earned_at: new Date().toISOString() }))
    ];
    // Bonus points for badges
    updates.total_points += newBadges.reduce((sum, b) => sum + b.points, 0);
  }

  await base44.entities.UserStats.update(stats.id, updates);
  return { newBadges, pointsEarned: points };
}