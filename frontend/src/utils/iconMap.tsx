import React from 'react';
import {
  BookOpen,
  Code,
  Dumbbell,
  Brain,
  Flame,
  Target,
  Heart,
  Smile,
  Coffee,
  Sparkles,
  Droplet,
  Sun,
  Moon,
  Music,
  CheckCircle,
  Zap,
} from 'lucide-react';

export const availableIcons: { name: string; label: string; component: React.ComponentType<{ className?: string }> }[] = [
  { name: 'Target', label: 'Target', component: Target },
  { name: 'BookOpen', label: 'Reading', component: BookOpen },
  { name: 'Code', label: 'Coding', component: Code },
  { name: 'Dumbbell', label: 'Fitness', component: Dumbbell },
  { name: 'Brain', label: 'Mind / Learning', component: Brain },
  { name: 'Flame', label: 'Streak / Energy', component: Flame },
  { name: 'Droplet', label: 'Hydration', component: Droplet },
  { name: 'Heart', label: 'Health', component: Heart },
  { name: 'Coffee', label: 'Morning / Break', component: Coffee },
  { name: 'Sparkles', label: 'Productivity', component: Sparkles },
  { name: 'Smile', label: 'Mood / Well-being', component: Smile },
  { name: 'Zap', label: 'Focus', component: Zap },
  { name: 'Music', label: 'Art / Creative', component: Music },
];

export function renderHabitIcon(iconName: string, className = 'w-5 h-5') {
  const found = availableIcons.find((i) => i.name.toLowerCase() === iconName?.toLowerCase());
  const IconComponent = found ? found.component : Target;
  return <IconComponent className={className} />;
}
