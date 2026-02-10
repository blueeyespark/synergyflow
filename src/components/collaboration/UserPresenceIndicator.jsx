import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function UserPresenceIndicator({ presences, currentUser }) {
  const otherUsers = presences.filter(p => 
    p.user_email !== currentUser?.email && 
    p.status === 'online'
  );

  if (otherUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {otherUsers.slice(0, 5).map((presence) => (
          <Tooltip key={presence.id}>
            <TooltipTrigger>
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  {presence.user_name?.charAt(0) || presence.user_email?.charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{presence.user_name || presence.user_email}</p>
              <p className="text-xs text-slate-400">Online now</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {otherUsers.length > 5 && (
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-medium border-2 border-white">
            +{otherUsers.length - 5}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}