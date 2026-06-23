import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAvatarUrl } from "@/lib/avatar";

interface Props {
  avatar: string | null | undefined;
  initials: string;
  className?: string;
  fallbackClassName?: string;
}

export const ProfileAvatar = ({ avatar, initials, className, fallbackClassName }: Props) => {
  const url = useAvatarUrl(avatar);
  return (
    <Avatar className={cn("border-2 border-border", className)}>
      <AvatarImage src={url} />
      <AvatarFallback className={cn("bg-primary text-primary-foreground", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
