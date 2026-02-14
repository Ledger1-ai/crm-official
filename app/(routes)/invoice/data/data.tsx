import { QuestionMarkCircledIcon, CheckCircledIcon, CircleIcon, StopwatchIcon } from "@radix-ui/react-icons";

export const statuses = [
  {
    value: "new",
    label: "New",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "UNPAID",
    label: "Unpaid",
    icon: CircleIcon,
  },
  {
    value: "PENDING",
    label: "Pending",
    icon: StopwatchIcon,
  },
  {
    value: "PAID",
    label: "Paid",
    icon: CheckCircledIcon,
  },
];
