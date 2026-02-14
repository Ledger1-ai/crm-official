
import {
    ChevronLeft,
    ChevronRight,
    Home,
    Users,
    Target,
    Radio,
    FileText,
    Phone,
    Package,
    Headset,
    Megaphone,
    Wand2,
    FormInput,
    Building2,
    Contact,
    Folder,
    CheckSquare,
    FileCheck,
    FileBarChart,
    UserCog,
    Zap,
    Shield,
    CheckCircle2,
    Wrench,
    GraduationCap,
    Globe,
    Mail,
    ServerIcon,
    MessageSquare,
    // Fallbacks
    Grid
} from "lucide-react";

export const ICON_MAP: Record<string, any> = {
    Home,
    Users,
    Target,
    Radio,
    FileText,
    Phone,
    Package,
    Headset,
    Megaphone,
    Wand2,
    FormInput,
    Building2,
    Contact,
    Folder,
    CheckSquare,
    FileCheck,
    FileBarChart,
    UserCog,
    Zap,
    Shield,
    CheckCircle2,
    Wrench,
    GraduationCap,
    Globe,
    Mail,
    ServerIcon,
    MessageSquare
};

export const getIcon = (name?: string) => {
    if (!name) return Grid;
    const icon = ICON_MAP[name];
    return icon || Grid;
};
