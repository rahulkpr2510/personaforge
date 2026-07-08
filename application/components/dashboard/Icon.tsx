import {
	LayoutDashboard,
	FlaskConical,
	Users,
	PlusCircle,
	UserCog,
	Settings,
	HelpCircle,
	History,
	CheckCircle,
	CircleCheckBig,
	AlertTriangle,
	Zap,
	type LucideProps
} from "lucide-react";

const iconMap = {
	LayoutDashboard,
	FlaskConical,
	Users,
	PlusCircle,
	UserCog,
	Settings,
	HelpCircle,
	History,
	CheckCircle,
	CircleCheckBig,
	AlertTriangle,
	Zap,
};

export type IconName = keyof typeof iconMap;

interface IconProps extends LucideProps {
	name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
	const LucideIconComponent = iconMap[name];
	if (!LucideIconComponent) return null;
	return <LucideIconComponent {...props} />;
}
