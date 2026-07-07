import { Button } from "@motiq/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@motiq/ui/components/dialog"
import { useMutation } from "@tanstack/react-query"
import { ExternalLinkIcon } from "lucide-react"
import { toast } from "sonner"
import { useTRPC } from "@/utils/trpc"

const oauthApps = new Set(["slack"])
type OAuthType = "slack"

interface AppConnectDialogProps {
  app: { type: string; name: string } | null
  onClose: () => void
}

export function AppConnectDialog({ app, onClose }: AppConnectDialogProps) {
  const trpc = useTRPC()

  const startOAuth = useMutation(
    trpc.apps.getOAuthUrl.mutationOptions({
      onSuccess: (data) => {
        window.location.href = data.url
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to start connection")
      },
    })
  )

  const isOAuth = !!app && oauthApps.has(app.type)

  const description = (() => {
    if (isOAuth && app) {
      return `You'll be redirected to ${app.name} to authorize Motiq.`
    }
    return "This app is not yet available."
  })()

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={!!app}>
      <DialogContent className="rounded-xl border border-white/[0.08] bg-zinc-950/95 shadow-2xl backdrop-blur-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium text-lg text-white tracking-tight">
            Connect {app?.name}
          </DialogTitle>
          <DialogDescription className="font-medium text-sm text-zinc-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4">
          <Button
            className="cursor-pointer rounded-sm font-medium text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            onClick={onClose}
            variant="ghost"
          >
            Cancel
          </Button>
          {isOAuth && app && (
            <Button
              className="cursor-pointer rounded-sm bg-white font-medium text-black text-sm transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={startOAuth.isPending}
              onClick={() =>
                startOAuth.mutate({
                  type: app.type as OAuthType,
                })
              }
            >
              <ExternalLinkIcon className="mr-2 size-3" />
              {startOAuth.isPending
                ? "Redirecting..."
                : `Authorize ${app.name}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
