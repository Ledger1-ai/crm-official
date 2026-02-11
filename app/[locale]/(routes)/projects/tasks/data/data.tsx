import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const statuses = [
  {
    value: "ACTIVE",
    label: "Active",
    icon: QuestionMarkCircledIcon,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    value: "PENDING",
    label: "Pending",
    icon: CircleIcon,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    value: "COMPLETE",
    label: "Complete",
    icon: StopwatchIcon,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDownIcon,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    dotColor: "bg-emerald-500",
  },
  {
    label: "Normal",
    value: "normal",
    icon: ArrowRightIcon,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    dotColor: "bg-amber-500",
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRightIcon,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    dotColor: "bg-amber-500",
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUpIcon,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    dotColor: "bg-purple-500",
  },
  {
    label: "Critical",
    value: "critical",
    icon: ArrowUpIcon,
    color: "text-red-600",
    bgColor: "bg-red-600/10",
    dotColor: "bg-red-600",
  },
];
